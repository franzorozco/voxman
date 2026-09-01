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
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $throttleKey = Str::transliterate(Str::lower($request->input('email')).'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $minutes = ceil($seconds / 60);
            return response()->json([
                'message' => 'Demasiados intentos de inicio de sesión. Por favor intente de nuevo en ' . $minutes . ' minutos.'
            ], 429);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            RateLimiter::hit($throttleKey, 1800);
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        if (!Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey, 1800);
            return response()->json([
                'message' => 'Contraseña incorrecta'
            ], 401);
        }

        RateLimiter::clear($throttleKey);

        $user->last_login = now();
        $user->save();

        $user->loadMissing('profile', 'customers.addresses', 'employee.branch');

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
                'full_name' => optional($user->profile)->first_name . ' ' . optional($user->profile)->last_name_paternal,
                'photo' => optional($user->profile)->photo ?? null,

                // 👇 INFORMACION DE EMPLEADO (SI APLICA)
                'employee' => $user->employee ? [
                    'id' => $user->employee->id,
                    'branch_id' => $user->employee->branch_id,
                    'branch' => $user->employee->branch ? [
                        'id' => $user->employee->branch->id,
                        'name' => $user->employee->branch->name
                    ] : null,
                ] : null,

                // 👇 ROLES Y PERMISOS
                'roles' => $user->getRoleNames(), 
                'permissions' => $user->getAllPermissions()->pluck('name'),
                
                // 👇 DATOS DE CLIENTE/PERFIL PARA LA TIENDA
                'profile' => $user->profile,
                'customers' => $user->customers,
            ],
            'token' => $token
        ]);
    }
}