<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Core\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Models\Core\UserProfile;

class SocialAuthController extends Controller
{
    /**
     * Redirige al usuario a la página de autenticación de Google.
     */
    public function redirect(Request $request)
    {
        // Guardamos el origen en el state si viene, o 'login' por defecto
        $origin = $request->query('origin', 'login');
        
        return response()->json([
            'url' => Socialite::driver('google')->stateless()->with(['state' => $origin])->redirect()->getTargetUrl()
        ]);
    }

    /**
     * Obtiene la información del usuario de Google.
     */
    public function callback(Request $request)
    {
        try {
            $origin = $request->query('state', 'login');
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            // Buscar si ya existe un usuario con ese correo
            $user = User::where('email', $googleUser->getEmail())->first();

            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

            if ($user) {
                // Actualizar google_id si no lo tiene
                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar(),
                    ]);
                }
                
                $user->last_login = now();
                $user->save();

                // Crear token de sesión
                $token = $user->createToken('auth_token', ['*'], now()->addMonth())->plainTextToken;

                // Redirigir al Frontend con el token
                return redirect($frontendUrl . '/auth/callback?token=' . $token . '&origin=' . $origin);

            } else {
                // El usuario no existe. Guardamos sus datos temporalmente en Caché.
                $regToken = Str::random(40);
                
                \Illuminate\Support\Facades\Cache::put('google_reg_' . $regToken, [
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'name' => $googleUser->getName()
                ], now()->addMinutes(30));

                $emailUrlEnc = urlencode($googleUser->getEmail());
                $nameUrlEnc = urlencode($googleUser->getName() ?? '');
                return redirect($frontendUrl . '/auth/callback?google_reg_token=' . $regToken . '&origin=' . $origin . '&email=' . $emailUrlEnc . '&name=' . $nameUrlEnc);
            }
        } catch (\Exception $e) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect($frontendUrl . '/login?error=google_auth_failed');
        }
    }

    /**
     * Completa el registro después de que el usuario llenó sus datos adicionales.
     */
    public function completeRegistration(Request $request)
    {
        $request->validate([
            'google_reg_token' => 'required|string',
            'username' => 'required|string|unique:users,username,NULL,id,deleted_at,NULL',
            'first_name' => 'required|string',
            'last_name_paternal' => 'nullable|string',
            'last_name_maternal' => 'nullable|string',
            'phone' => 'nullable|string'
        ]);

        $cachedData = \Illuminate\Support\Facades\Cache::get('google_reg_' . $request->google_reg_token);

        if (!$cachedData) {
            return response()->json(['message' => 'El token de registro es inválido o ha expirado. Inténtalo de nuevo.'], 400);
        }

        $user = \Illuminate\Support\Facades\DB::transaction(function() use ($cachedData, $request) {
            // Crear usuario
            $user = User::create([
                'email' => $cachedData['email'],
                'username' => $request->username,
                'password' => Hash::make(Str::random(24)),
                'google_id' => $cachedData['google_id'],
                'avatar' => $cachedData['avatar'],
                'is_active' => true,
                'last_login' => now(),
            ]);

            $user->assignRole('Usuario');

            // Crear Perfil
            UserProfile::create([
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'last_name_paternal' => $request->last_name_paternal,
                'last_name_maternal' => $request->last_name_maternal,
                'phone' => $request->phone,
            ]);

            return $user;
        });

        // Limpiar caché
        \Illuminate\Support\Facades\Cache::forget('google_reg_' . $request->google_reg_token);

        // Crear token de sesión
        $token = $user->createToken('auth_token', ['*'], now()->addMonth())->plainTextToken;
        
        $user->load('profile', 'roles');

        return response()->json([
            'message' => 'Cuenta creada exitosamente.',
            'user' => $user,
            'token' => $token
        ]);
    }
}
