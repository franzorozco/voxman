<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Mail\VerifyEmailCode;
use App\Models\Core\User;
use App\Models\Core\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class RegisterController extends Controller
{
    public const CODE_TTL_MINUTES = 1440; // 24 horas para verificar desde el perfil
    public const RESEND_COOLDOWN_SECONDS = 60;
    public const MAX_VERIFY_ATTEMPTS = 5;

    /**
     * Genera un código de 6 dígitos, lo guarda en caché por 15 minutos y envía el correo VerifyEmailCode.
     */
    public static function dispatchVerificationCode(User $user, bool $respectCooldown = false): array
    {
        $email = Str::lower(trim($user->email));
        $cooldownKey = 'email_verify_cooldown_' . $email;

        if ($respectCooldown && Cache::has($cooldownKey)) {
            $remaining = max(1, (int) Cache::get($cooldownKey) - now()->timestamp);
            return [
                'sent' => false,
                'cooldown_seconds' => $remaining,
            ];
        }

        $code = (string) random_int(100000, 999999);

        Cache::put('email_verify_code_' . $email, [
            'hash' => Hash::make($code),
            'user_id' => $user->id,
            'attempts' => 0,
            'created_at' => now()->timestamp,
        ], now()->addMinutes(self::CODE_TTL_MINUTES));

        Cache::put($cooldownKey, now()->addSeconds(self::RESEND_COOLDOWN_SECONDS)->timestamp, now()->addSeconds(self::RESEND_COOLDOWN_SECONDS));

        $user->loadMissing('profile');
        $displayName = trim((string) (optional($user->profile)->first_name ?: $user->username ?: Str::before($email, '@')));

        Mail::to($email)->send(new VerifyEmailCode(
            customerName: $displayName,
            customerEmail: $email,
            verificationCode: $code,
            expiresInMinutes: self::CODE_TTL_MINUTES
        ));

        return [
            'sent' => true,
            'cooldown_seconds' => self::RESEND_COOLDOWN_SECONDS,
        ];
    }

    /**
     * Extrae el username desde el correo sin el dominio (@gmail.com, @hotmail.com, etc.)
     */
    private function extractUsernameFromEmail(string $email, ?string $preferredUsername = null, ?string $ignoreUserId = null): string
    {
        $candidate = trim((string) $preferredUsername);
        if ($candidate !== '' && str_contains($candidate, '@')) {
            $candidate = trim(Str::before($candidate, '@'));
        }
        if ($candidate === '') {
            $candidate = trim(Str::before(trim($email), '@'));
        }
        if ($candidate === '') {
            $candidate = 'user_' . Str::lower(Str::random(6));
        }

        $baseUsername = Str::limit($candidate, 50, '');

        // Liberar username de usuarios eliminados hace >= 60 días
        $oldTrashedUsers = User::onlyTrashed()
            ->whereRaw('LOWER(username) = ?', [Str::lower($baseUsername)])
            ->when($ignoreUserId, fn($q) => $q->where('id', '!=', $ignoreUserId))
            ->get();

        foreach ($oldTrashedUsers as $trashedUser) {
            if ($trashedUser->deleted_at && \Carbon\Carbon::parse($trashedUser->deleted_at)->diffInDays(now()) >= 60) {
                DB::table('users')
                    ->where('id', $trashedUser->id)
                    ->update(['username' => 'del_' . Str::lower(Str::random(6)) . '_' . Str::limit($baseUsername, 30, '')]);
            }
        }

        $username = $baseUsername;
        $counter = 1;
        while (
            User::withTrashed()
                ->whereRaw('LOWER(username) = ?', [Str::lower($username)])
                ->when($ignoreUserId, fn($q) => $q->where('id', '!=', $ignoreUserId))
                ->exists()
        ) {
            $suffix = '_' . $counter;
            $username = Str::limit($baseUsername, 50 - strlen($suffix), '') . $suffix;
            $counter++;
        }

        return $username;
    }

    /**
     * Valida en tiempo real el correo en la página /register:
     * - Si existe, está activo y verificado -> no permitido.
     * - Si existe, está activo pero SIN verificar -> permitido (se reenviará código de verificación).
     * - Si existe, está eliminado y lleva < 60 días -> no permitido.
     * - Si existe, está eliminado y lleva >= 60 días -> permitido.
     */
    public function checkEmail(Request $request)
    {
        User::ensureEmailVerificationSchema();
        User::purgeExpiredUnverifiedUsers(24);

        $rawEmail = trim((string) $request->query('email', ''));

        if ($rawEmail === '' || !filter_var($rawEmail, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'valid_format' => false,
                'available' => false,
                'status' => 'invalid_format',
                'username_preview' => $rawEmail !== '' ? Str::before($rawEmail, '@') : '',
                'message' => 'Ingresa un correo electrónico con formato válido.'
            ]);
        }

        $email = Str::lower($rawEmail);
        $usernamePreview = Str::before($email, '@');

        $existingUser = User::withTrashed()
            ->with(['customer' => fn($q) => $q->withTrashed()])
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        if (!$existingUser) {
            return response()->json([
                'valid_format' => true,
                'available' => true,
                'status' => 'available',
                'username_preview' => $usernamePreview,
                'message' => 'Correo electrónico disponible.'
            ]);
        }

        $deletedAt = $existingUser->deleted_at ?? $existingUser->customer?->deleted_at;

        if ($deletedAt === null) {
            if ($existingUser->email_verified_at === null && $existingUser->google_id === null) {
                return response()->json([
                    'valid_format' => true,
                    'available' => true,
                    'status' => 'unverified_exists',
                    'username_preview' => $usernamePreview,
                    'message' => 'Aviso: Este correo tiene un registro pendiente de verificación. Al registrarte te enviaremos un nuevo código de 6 dígitos para activarlo.'
                ]);
            }

            return response()->json([
                'valid_format' => true,
                'available' => false,
                'status' => 'active_exists',
                'username_preview' => $usernamePreview,
                'message' => 'Advertencia: Este correo electrónico ya está registrado y verificado. No se puede sobrescribir una cuenta activa.'
            ]);
        }

        $deletedDate = \Carbon\Carbon::parse($deletedAt);
        $daysDeleted = (int) floor($deletedDate->diffInDays(now()));

        if ($daysDeleted < 60) {
            $daysRemaining = max(1, 60 - $daysDeleted);
            return response()->json([
                'valid_format' => true,
                'available' => false,
                'status' => 'deleted_under_60',
                'days_deleted' => $daysDeleted,
                'days_remaining' => $daysRemaining,
                'username_preview' => $usernamePreview,
                'message' => "Advertencia: Este correo pertenece a una cuenta eliminada hace {$daysDeleted} día(s). Deben pasar más de 60 días para poder volver a crearla (faltan {$daysRemaining} día(s))."
            ]);
        }

        return response()->json([
            'valid_format' => true,
            'available' => true,
            'status' => 'deleted_over_60',
            'days_deleted' => $daysDeleted,
            'username_preview' => $usernamePreview,
            'message' => "Aviso: Este correo pertenecía a una cuenta eliminada hace {$daysDeleted} días (más de 60 días). Está permitido crear la nueva cuenta con este correo."
        ]);
    }

    public function __invoke(RegisterRequest $request)
    {
        try {
            User::ensureEmailVerificationSchema();

            $user = DB::transaction(function () use ($request) {
                $email = Str::lower(trim((string) $request->email));

                $existingUser = User::withTrashed()
                    ->with([
                        'profile' => fn($q) => $q->withTrashed(),
                        'customer' => fn($q) => $q->withTrashed()
                    ])
                    ->whereRaw('LOWER(email) = ?', [$email])
                    ->first();

                $username = $this->extractUsernameFromEmail($email, $request->username, $existingUser?->id);
                $firstName = $request->filled('first_name') ? trim((string) $request->first_name) : $username;
                $lastNamePaternal = $request->filled('last_name_paternal') ? trim((string) $request->last_name_paternal) : null;
                $lastNameMaternal = $request->filled('last_name_maternal') ? trim((string) $request->last_name_maternal) : null;
                $phone = $request->filled('phone') ? trim((string) $request->phone) : null;

                if ($existingUser) {
                    // Cuenta eliminada hace >= 60 días o cuenta previa sin verificar
                    if ($existingUser->trashed()) {
                        $existingUser->restore();
                    }

                    $existingUser->update([
                        'email' => $email,
                        'username' => $username,
                        'password' => Hash::make($request->password),
                        'is_active' => true,
                        'email_verified_at' => null,
                        'google_id' => null,
                        'avatar' => null,
                    ]);

                    $user = $existingUser;

                    $existingProfile = UserProfile::withTrashed()->where('user_id', $user->id)->first();
                    if ($existingProfile) {
                        if ($existingProfile->trashed()) {
                            $existingProfile->restore();
                        }
                        $existingProfile->update([
                            'first_name' => $firstName,
                            'last_name_paternal' => $lastNamePaternal,
                            'last_name_maternal' => $lastNameMaternal,
                            'phone' => $phone,
                        ]);
                    } else {
                        UserProfile::create([
                            'user_id' => $user->id,
                            'first_name' => $firstName,
                            'last_name_paternal' => $lastNamePaternal,
                            'last_name_maternal' => $lastNameMaternal,
                            'phone' => $phone,
                        ]);
                    }
                } else {
                    $user = User::create([
                        'email' => $email,
                        'username' => $username,
                        'password' => Hash::make($request->password),
                        'is_active' => true,
                        'email_verified_at' => null,
                    ]);

                    UserProfile::create([
                        'user_id' => $user->id,
                        'first_name' => $firstName,
                        'last_name_paternal' => $lastNamePaternal,
                        'last_name_maternal' => $lastNameMaternal,
                        'phone' => $phone,
                    ]);
                }

                $user->syncRoles(['Usuario']);

                return $user;
            });

            try {
                self::dispatchVerificationCode($user, false);
            } catch (\Throwable $mailErr) {
                Log::warning('No se pudo enviar el correo de verificación inicial: ' . $mailErr->getMessage());
            }

            $user->loadMissing('profile', 'customers.addresses', 'employee.branch');
            $token = $user->createToken('auth_token', ['*'], now()->addHours(24))->plainTextToken;

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'username' => $user->username,
                    'email_verified_at' => $user->email_verified_at,
                    'is_email_verified' => false,
                    'full_name' => trim(optional($user->profile)->first_name . ' ' . optional($user->profile)->last_name_paternal),
                    'photo' => optional($user->profile)->photo ?? null,
                    'employee' => null,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                    'profile' => $user->profile,
                    'customers' => $user->customers,
                ],
                'token' => $token,
                'message' => 'Cuenta creada. Te hemos enviado un código de verificación a tu correo para que confirmes tu cuenta desde tu perfil.'
            ], 201);

        } catch (\Throwable $e) {
            Log::error('Error en registro: ' . $e->getMessage());
            return response()->json([
                'message' => 'No se pudo completar el registro. Inténtalo de nuevo.'
            ], 500);
        }
    }

    /**
     * Verifica el código de 6 dígitos enviado al correo y activa la cuenta.
     */
    public function verifyCode(Request $request)
    {
        User::ensureEmailVerificationSchema();

        $request->validate([
            'email' => 'required|string|email|max:150',
            'code'  => ['required', 'string', 'regex:/^[0-9]{6}$/'],
        ], [
            'code.regex' => 'El código de verificación debe tener exactamente 6 dígitos numéricos.',
        ]);

        $email = Str::lower(trim((string) $request->input('email')));
        $code  = trim((string) $request->input('code'));
        $cacheKey = 'email_verify_code_' . $email;

        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$user) {
            return response()->json([
                'message' => 'No se encontró una cuenta pendiente para este correo electrónico.'
            ], 404);
        }

        if ($user->email_verified_at !== null) {
            return response()->json([
                'message' => 'Este correo electrónico ya fue verificado anteriormente.'
            ], 409);
        }

        $cached = Cache::get($cacheKey);
        if (!$cached || !is_array($cached) || empty($cached['hash'])) {
            return response()->json([
                'message' => 'El código de verificación ha expirado o no existe. Solicita un nuevo código desde tu perfil.'
            ], 422);
        }

        $attempts = (int) ($cached['attempts'] ?? 0);
        if ($attempts >= self::MAX_VERIFY_ATTEMPTS) {
            Cache::forget($cacheKey);
            return response()->json([
                'message' => 'Has superado el número máximo de intentos. Solicita un nuevo código de verificación.'
            ], 429);
        }

        if (!Hash::check($code, $cached['hash'])) {
            $cached['attempts'] = $attempts + 1;
            $remainingAttempts = max(0, self::MAX_VERIFY_ATTEMPTS - $cached['attempts']);
            if ($remainingAttempts === 0) {
                Cache::forget($cacheKey);
                return response()->json([
                    'message' => 'Código incorrecto. Se agotaron los intentos, solicita un nuevo código.'
                ], 422);
            }

            Cache::put($cacheKey, $cached, now()->addMinutes(self::CODE_TTL_MINUTES));
            return response()->json([
                'message' => "Código de verificación incorrecto. Te quedan {$remainingAttempts} intento(s)."
            ], 422);
        }

        // Código válido: marcar cuenta como verificada y generar sesión
        Cache::forget($cacheKey);
        Cache::forget('email_verify_cooldown_' . $email);

        $user->email_verified_at = now();
        $user->last_login = now();
        $user->is_active = true;
        $user->save();

        $user->loadMissing('profile', 'customers.addresses', 'employee.branch');

        $token = $user->createToken('auth_token', ['*'], now()->addHours(24))->plainTextToken;

        return response()->json([
            'message' => 'Correo electrónico verificado con éxito.',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
                'email_verified_at' => $user->email_verified_at,
                'is_email_verified' => true,
                'full_name' => trim(optional($user->profile)->first_name . ' ' . optional($user->profile)->last_name_paternal),
                'photo' => optional($user->profile)->photo ?? null,
                'employee' => $user->employee ? [
                    'id' => $user->employee->id,
                    'branch_id' => $user->employee->branch_id,
                    'branch' => $user->employee->branch ? [
                        'id' => $user->employee->branch->id,
                        'name' => $user->employee->branch->name,
                    ] : null,
                ] : null,
                'roles' => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'profile' => $user->profile,
                'customers' => $user->customers,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Reenvía un nuevo código de 6 dígitos al correo de una cuenta aún no verificada.
     */
    public function resendCode(Request $request)
    {
        User::ensureEmailVerificationSchema();

        $request->validate([
            'email' => 'required|string|email|max:150',
        ]);

        $email = Str::lower(trim((string) $request->input('email')));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (!$user) {
            return response()->json([
                'message' => 'No se encontró una cuenta registrada con este correo electrónico.'
            ], 404);
        }

        if ($user->email_verified_at !== null) {
            return response()->json([
                'message' => 'Esta cuenta ya está verificada. Puedes iniciar sesión directamente.'
            ], 409);
        }

        try {
            $dispatch = self::dispatchVerificationCode($user, true);
            if (!$dispatch['sent']) {
                return response()->json([
                    'message' => "Por favor espera {$dispatch['cooldown_seconds']} segundo(s) antes de solicitar otro código.",
                    'cooldown_seconds' => $dispatch['cooldown_seconds'],
                ], 429);
            }

            return response()->json([
                'message' => 'Se ha enviado un nuevo código de verificación a tu correo electrónico.',
                'cooldown_seconds' => self::RESEND_COOLDOWN_SECONDS,
            ]);
        } catch (\Throwable $e) {
            Log::error('Error reenviando código de verificación: ' . $e->getMessage());
            return response()->json([
                'message' => 'No se pudo enviar el correo de verificación. Inténtalo de nuevo en unos momentos.'
            ], 500);
        }
    }
}