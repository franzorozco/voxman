<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Core\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class ResetPasswordController extends Controller
{
    public function reset(Request $request)
    {
        $request->validate([
            'token' => 'required|string|max:255',
            'email' => 'required|string|email|max:150',
            // Misma política que el registro (antes: min:6 sin máximo)
            'password' => ['required', 'string', 'confirmed', 'max:72', PasswordRule::min(8)->letters()->numbers()],
        ]);

        // Resolver el correo guardado (búsqueda sin distinguir mayúsculas)
        $email = Str::lower(trim($request->input('email')));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        $status = Password::broker()->reset(
            [
                'email' => $user ? $user->email : $email,
                'password' => $request->input('password'),
                'password_confirmation' => $request->input('password_confirmation'),
                'token' => $request->input('token'),
            ],
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ]);

                $user->save();

                // 🔒 Cerrar TODAS las sesiones activas: si alguien tenía la cuenta comprometida,
                // restablecer la contraseña ahora sí lo saca (antes sus tokens seguían funcionando).
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Contraseña actualizada correctamente.']);
        }

        // 🔒 Mensaje único para token inválido / expirado / correo inexistente (no revela cuál fue)
        return response()->json([
            'message' => 'El enlace es inválido o ha expirado. Solicita uno nuevo.'
        ], 400);
    }
}
