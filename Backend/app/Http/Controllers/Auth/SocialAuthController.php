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
        return response()->json([
            'url' => Socialite::driver('google')->stateless()->redirect()->getTargetUrl()
        ]);
    }

    /**
     * Obtiene la información del usuario de Google.
     */
    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            // Buscar si ya existe un usuario con ese correo
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Actualizar google_id si no lo tiene
                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar(),
                    ]);
                }
            } else {
                // Crear un nuevo usuario
                $user = User::create([
                    'email' => $googleUser->getEmail(),
                    'username' => Str::slug($googleUser->getName(), '_') . '_' . Str::random(4),
                    'password' => Hash::make(Str::random(24)),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'is_active' => true,
                ]);

                // Asignar rol por defecto (ej. invitado)
                $user->assignRole('Invitado');

                // Crear perfil vacío para evitar errores de relación
                UserProfile::create([
                    'user_id' => $user->id,
                    'first_name' => $googleUser->getName(),
                    'last_name' => '',
                ]);
            }

            $user->last_login = now();
            $user->save();

            // Crear token de sesión
            $token = $user->createToken('auth_token', ['*'], now()->addMonth())->plainTextToken;

            // Redirigir al Frontend con el token
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            
            return redirect($frontendUrl . '/auth/callback?token=' . $token);
            
        } catch (\Exception $e) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect($frontendUrl . '/login?error=google_auth_failed');
        }
    }
}
