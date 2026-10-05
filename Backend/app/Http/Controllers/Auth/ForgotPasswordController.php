<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Core\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate(['email' => 'required|string|email|max:150']);

        $email = Str::lower(trim($request->input('email')));

        // 🔒 El envío se hace DESPUÉS de responder y siempre se contesta lo mismo:
        //  - antes devolvía 400 "We can't find a user..." → permitía descubrir qué correos existen
        //  - si el envío fallaba solo para correos reales, el 500 también delataba la cuenta
        //  - enviar el correo tarda más que no enviarlo → habría una diferencia medible en el tiempo
        dispatch(function () use ($email) {
            try {
                $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
                if ($user && $user->is_active !== false) {
                    // Se usa el correo tal como está guardado (el broker compara exacto)
                    Password::broker()->sendResetLink(['email' => $user->email]);
                }
            } catch (\Throwable $e) {
                Log::error('forgot-password: ' . $e->getMessage());
            }
        })->afterResponse();

        return response()->json([
            'message' => 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.'
        ]);
    }
}
