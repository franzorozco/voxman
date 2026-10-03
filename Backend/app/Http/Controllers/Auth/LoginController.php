<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Core\User;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class LoginController extends Controller
{
    public function __invoke(Request $request)
    {
        // 🔒 Límites de tamaño: evitan payloads gigantes (el hash solo usa los primeros 72 bytes)
        $request->validate([
            'email' => 'required|string|email|max:150',
            'password' => 'required|string|max:255',
            'remember' => 'sometimes|boolean',
        ]);

        $email = Str::lower(trim($request->input('email')));
        $throttleKey = Str::transliterate($email.'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $minutes = ceil($seconds / 60);
            return response()->json([
                'message' => 'Demasiados intentos de inicio de sesión. Por favor intente de nuevo en ' . $minutes . ' minutos.'
            ], 429);
        }

        // Búsqueda sin distinguir mayúsculas (evita cuentas duplicadas "A@x.com" / "a@x.com")
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        // 🔒 Tiempo constante: si el usuario no existe igual se calcula un hash, así no se puede
        // adivinar qué correos están registrados midiendo cuánto tarda la respuesta.
        if ($user) {
            $passwordOk = Hash::check($request->password, $user->password);
        } else {
            Hash::make(Str::random(16));
            $passwordOk = false;
        }

        if (!$passwordOk) {
            RateLimiter::hit($throttleKey, 1800);
            // 🔒 Mensaje único: antes devolvía "Usuario no encontrado" (404) vs "Contraseña incorrecta" (401),
            // lo que permitía descubrir qué correos tienen cuenta.
            return response()->json([
                'message' => 'Correo o contraseña incorrectos'
            ], 401);
        }

        // 🔒 Cuentas desactivadas no pueden iniciar sesión (is_active nunca se verificaba)
        if ($user->is_active === false) {
            return response()->json([
                'message' => 'Tu cuenta está desactivada. Contacta a soporte.'
            ], 403);
        }

        RateLimiter::clear($throttleKey);

        $user->last_login = now();
        $user->save();

        $user->loadMissing('profile', 'customers.addresses', 'employee.branch');

        $expiresAt = $request->boolean('remember') ? now()->addMonth() : now()->addHours(24);
        $token = $user->createToken('auth_token', ['*'], $expiresAt)->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
                'full_name' => optional($user->profile)->first_name . ' ' . optional($user->profile)->last_name_paternal,
                'photo' => optional($user->profile)->photo ?? null,

                //INFORMACION DE EMPLEADO (SI APLICA)
                'employee' => $user->employee ? [
                    'id' => $user->employee->id,
                    'branch_id' => $user->employee->branch_id,
                    'branch' => $user->employee->branch ? [
                        'id' => $user->employee->branch->id,
                        'name' => $user->employee->branch->name
                    ] : null,
                ] : null,

                //ROLES Y PERMISOS
                'roles' => $user->getRoleNames(), 
                'permissions' => $user->getAllPermissions()->pluck('name'),
                
                //DATOS DE CLIENTE/PERFIL PARA LA TIENDA
                'profile' => $user->profile,
                'customers' => $user->customers,
            ],
            'token' => $token
        ]);
    }
}