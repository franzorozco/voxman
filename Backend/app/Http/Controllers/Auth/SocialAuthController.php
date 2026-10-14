<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Core\User;
use App\Models\Core\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /** Orígenes permitidos (de dónde se inició el login con Google). */
    private const ORIGINS = ['login', 'shop'];

    private function frontendUrl(): string
    {
        return rtrim(config('app.frontend_url'), '/');
    }

    private function failRedirect(string $reason = 'google_auth_failed')
    {
        return redirect($this->frontendUrl() . '/login?error=' . $reason);
    }

    /**
     * Redirige al usuario a la página de autenticación de Google.
     *
     * 🔒 El parámetro `state` ya NO es el valor que manda el cliente. Es un nonce aleatorio de un
     * solo uso guardado en servidor (con el origen validado). Antes:
     *  - sin validación de state → "login CSRF": un atacante podía iniciar sesión a la víctima en la cuenta del atacante
     *  - `state` se concatenaba sin escapar en la URL de retorno → inyección de parámetros
     *    (ej. origin=shop&token=EVIL hacía que el frontend usara un token elegido por el atacante)
     */
    public function redirect(Request $request)
    {
        $origin = $request->query('origin', 'login');
        if (!is_string($origin) || !in_array($origin, self::ORIGINS, true)) {
            $origin = 'login';
        }

        $nonce = Str::random(40);
        Cache::put('google_oauth_state_' . $nonce, $origin, now()->addMinutes(10));

        return response()->json([
            'url' => Socialite::driver('google')->stateless()->with(['state' => $nonce])->redirect()->getTargetUrl()
        ]);
    }

    /**
     * Obtiene la información del usuario de Google.
     *
     * 🔒 Ya no se envía el token de sesión en la URL (quedaba en historial, logs del servidor y cabecera Referer).
     * Se redirige con un `code` de un solo uso y 60 s de vida que el frontend canjea en POST /auth/google/exchange.
     */
    public function callback(Request $request)
    {
        // Validar y consumir el state (un solo uso)
        $state = $request->query('state');
        $origin = is_string($state) ? Cache::pull('google_oauth_state_' . $state) : null;
        if (!$origin) {
            return $this->failRedirect('invalid_state');
        }

        try {
            User::ensureEmailVerificationSchema();

            $googleUser = Socialite::driver('google')->stateless()->user();

            $email = Str::lower(trim((string) $googleUser->getEmail()));

            // 🔒 Exigir que Google haya verificado el correo. Si no, alguien podría crear una cuenta de Google
            // con el correo de otra persona y entrar a su cuenta aquí.
            $raw = is_array($googleUser->user ?? null) ? $googleUser->user : [];
            $verified = filter_var($raw['email_verified'] ?? $raw['verified_email'] ?? false, FILTER_VALIDATE_BOOLEAN);
            if ($email === '' || !$verified) {
                return $this->failRedirect('email_not_verified');
            }

            $user = User::withTrashed()
                ->with(['customer' => fn($q) => $q->withTrashed()])
                ->whereRaw('LOWER(email) = ?', [$email])
                ->first();

            $deletedAt = $user ? ($user->deleted_at ?? $user->customer?->deleted_at) : null;

            if ($user && $deletedAt !== null) {
                $daysDeleted = (int) floor(\Carbon\Carbon::parse($deletedAt)->diffInDays(now()));
                if ($daysDeleted < 60) {
                    return $this->failRedirect('account_deleted_under_60');
                }
                // Si tiene >= 60 días de eliminado, pasa al flujo de registro para restaurar/recrear su perfil
                $user = null;
            }

            if ($user) {
                if ($user->is_active === false) {
                    return $this->failRedirect('account_disabled');
                }

                // La cuenta ya está vinculada a OTRA cuenta de Google → rechazar
                if ($user->google_id && $user->google_id !== (string) $googleUser->getId()) {
                    return $this->failRedirect('google_auth_failed');
                }

                if (!$user->google_id) {
                    $wasUnverified = ($user->email_verified_at === null);
                    $user->tokens()->delete();

                    $updatePayload = [
                        'google_id' => (string) $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar(),
                        'email_verified_at' => $user->email_verified_at ?? now(),
                    ];

                    // Si la cuenta previa nunca había verificado su correo, rotamos la contraseña por seguridad
                    if ($wasUnverified) {
                        $updatePayload['password'] = Hash::make(Str::random(40));
                    }

                    $user->update($updatePayload);
                } elseif ($user->email_verified_at === null) {
                    $user->email_verified_at = now();
                }

                $user->last_login = now();
                $user->save();

                $token = $user->createToken('auth_token', ['*'], now()->addMonth())->plainTextToken;

                $code = $this->storeExchange([
                    'type' => 'login',
                    'token' => $token,
                    'origin' => $origin,
                ]);
            } else {
                // El usuario no existe (o fue eliminado hace >= 60 días). Guardamos sus datos temporalmente en Caché.
                $regToken = Str::random(40);

                Cache::put('google_reg_' . $regToken, [
                    'email' => $email,
                    'google_id' => (string) $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'name' => $googleUser->getName(),
                ], now()->addMinutes(30));

                $code = $this->storeExchange([
                    'type' => 'register',
                    'google_reg_token' => $regToken,
                    'email' => $email,
                    'name' => (string) ($googleUser->getName() ?? ''),
                    'origin' => $origin,
                ]);
            }

            return redirect($this->frontendUrl() . '/auth/callback?code=' . $code);
        } catch (\Throwable $e) {
            Log::warning('Google callback: ' . $e->getMessage());
            return $this->failRedirect();
        }
    }

    /**
     * Canjea el `code` de un solo uso por el token de sesión / datos de registro.
     */
    public function exchange(Request $request)
    {
        $request->validate(['code' => 'required|string|size:48']);

        $data = Cache::pull('google_oauth_exchange_' . $request->input('code'));
        if (!$data) {
            return response()->json(['message' => 'El código es inválido o ha expirado. Inténtalo de nuevo.'], 400);
        }

        return response()->json($data);
    }

    /**
     * Completa el registro después de que el usuario llenó sus datos adicionales.
     */
    public function completeRegistration(Request $request)
    {
        User::ensureEmailVerificationSchema();

        $request->validate([
            'google_reg_token' => 'required|string|size:40',
            'username' => ['nullable', 'string', 'max:50'],
            'first_name' => 'required|string|min:2|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s()]*$/'],
        ]);

        $cacheKey = 'google_reg_' . $request->google_reg_token;
        $cachedData = Cache::get($cacheKey);

        if (!$cachedData) {
            return response()->json(['message' => 'El token de registro es inválido o ha expirado. Inténtalo de nuevo.'], 400);
        }

        $email = Str::lower(trim((string) $cachedData['email']));

        $existingUser = User::withTrashed()
            ->with(['customer' => fn($q) => $q->withTrashed()])
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        if ($existingUser) {
            $deletedAt = $existingUser->deleted_at ?? $existingUser->customer?->deleted_at;
            if ($deletedAt === null) {
                // Si la cuenta ya estaba verificada, no se puede volver a registrar
                if ($existingUser->email_verified_at !== null || $existingUser->google_id !== null) {
                    Cache::forget($cacheKey);
                    return response()->json([
                        'message' => 'Advertencia: Este correo electrónico ya está registrado y activo. Inicia sesión con Google.'
                    ], 409);
                }
            } else {
                $daysDeleted = (int) floor(\Carbon\Carbon::parse($deletedAt)->diffInDays(now()));
                if ($daysDeleted < 60) {
                    $daysRemaining = max(1, 60 - $daysDeleted);
                    return response()->json([
                        'message' => "Advertencia: Este correo pertenece a una cuenta eliminada hace {$daysDeleted} día(s). Deben pasar más de 60 días para poder volver a crearla (faltan {$daysRemaining} día(s))."
                    ], 422);
                }
            }
        }

        try {
            $user = DB::transaction(function () use ($cachedData, $request, $email, $existingUser) {
                $rawUser = trim((string) ($request->username ?? ''));
                if ($rawUser !== '' && str_contains($rawUser, '@')) {
                    $rawUser = trim(Str::before($rawUser, '@'));
                }
                if ($rawUser === '') {
                    $rawUser = trim(Str::before($email, '@'));
                }
                $baseUsername = Str::limit($rawUser !== '' ? $rawUser : 'user_' . Str::lower(Str::random(6)), 50, '');

                $username = $baseUsername;
                $counter = 1;
                while (
                    User::withTrashed()
                        ->whereRaw('LOWER(username) = ?', [Str::lower($username)])
                        ->when($existingUser, fn($q) => $q->where('id', '!=', $existingUser->id))
                        ->exists()
                ) {
                    $suffix = '_' . $counter;
                    $username = Str::limit($baseUsername, 50 - strlen($suffix), '') . $suffix;
                    $counter++;
                }

                if ($existingUser) {
                    if ($existingUser->trashed()) {
                        $existingUser->restore();
                    }
                    $existingUser->update([
                        'email' => $email,
                        'username' => $username,
                        'password' => Hash::make(Str::random(24)),
                        'google_id' => $cachedData['google_id'],
                        'avatar' => $cachedData['avatar'],
                        'is_active' => true,
                        'email_verified_at' => now(),
                        'last_login' => now(),
                    ]);
                    $user = $existingUser;

                    $existingProfile = UserProfile::withTrashed()->where('user_id', $user->id)->first();
                    if ($existingProfile) {
                        if ($existingProfile->trashed()) {
                            $existingProfile->restore();
                        }
                        $existingProfile->update([
                            'first_name' => trim((string) $request->first_name),
                            'last_name_paternal' => $request->filled('last_name_paternal') ? trim((string) $request->last_name_paternal) : null,
                            'last_name_maternal' => $request->filled('last_name_maternal') ? trim((string) $request->last_name_maternal) : null,
                            'phone' => $request->filled('phone') ? trim((string) $request->phone) : null,
                        ]);
                    } else {
                        UserProfile::create([
                            'user_id' => $user->id,
                            'first_name' => trim((string) $request->first_name),
                            'last_name_paternal' => $request->filled('last_name_paternal') ? trim((string) $request->last_name_paternal) : null,
                            'last_name_maternal' => $request->filled('last_name_maternal') ? trim((string) $request->last_name_maternal) : null,
                            'phone' => $request->filled('phone') ? trim((string) $request->phone) : null,
                        ]);
                    }
                } else {
                    $user = User::create([
                        'email' => $email,
                        'username' => $username,
                        'password' => Hash::make(Str::random(24)),
                        'google_id' => $cachedData['google_id'],
                        'avatar' => $cachedData['avatar'],
                        'is_active' => true,
                        'email_verified_at' => now(),
                        'last_login' => now(),
                    ]);

                    UserProfile::create([
                        'user_id' => $user->id,
                        'first_name' => trim((string) $request->first_name),
                        'last_name_paternal' => $request->filled('last_name_paternal') ? trim((string) $request->last_name_paternal) : null,
                        'last_name_maternal' => $request->filled('last_name_maternal') ? trim((string) $request->last_name_maternal) : null,
                        'phone' => $request->filled('phone') ? trim((string) $request->phone) : null,
                    ]);
                }

                $user->syncRoles(['Usuario']);

                return $user;
            });
        } catch (\Throwable $e) {
            Log::error('Google complete-registration: ' . $e->getMessage());
            return response()->json(['message' => 'No se pudo completar el registro. Inténtalo de nuevo.'], 500);
        }

        // Token de un solo uso: se consume solo si el registro fue exitoso
        Cache::forget($cacheKey);

        $token = $user->createToken('auth_token', ['*'], now()->addMonth())->plainTextToken;

        $user->load('profile', 'roles');
        $user->makeHidden(['google_id']);

        return response()->json([
            'message' => 'Cuenta creada exitosamente.',
            'user' => $user,
            'token' => $token
        ]);
    }

    /** Guarda datos temporales y devuelve un código de un solo uso (60 s). */
    private function storeExchange(array $payload): string
    {
        $code = Str::random(48);
        Cache::put('google_oauth_exchange_' . $code, $payload, now()->addSeconds(60));
        return $code;
    }
}
