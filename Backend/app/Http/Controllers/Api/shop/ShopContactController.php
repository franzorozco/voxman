<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Core\User;
use App\Models\System\SystemSetting;
use App\Mail\ContactSupportMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ShopContactController extends Controller
{
    /**
     * Valida si un correo electrónico pertenece a una cuenta registrada en el sistema.
     * POST /api/v1/shop/contact/check-email
     */
    public function checkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::with('profile')
            ->where('email', strtolower(trim($request->email)))
            ->first();

        if (!$user) {
            return response()->json([
                'exists' => false,
                'message' => 'No encontramos ninguna cuenta registrada con este correo electrónico.'
            ]);
        }

        $fullName = null;
        if ($user->profile) {
            $fullName = trim(($user->profile->first_name ?? '') . ' ' . ($user->profile->last_name_paternal ?? ''));
        }

        return response()->json([
            'exists' => true,
            'name' => !empty($fullName) ? $fullName : $user->username,
            'is_verified' => !empty($user->email_verified_at) || !empty($user->google_id),
            'message' => 'Cuenta verificada en el sistema.'
        ]);
    }

    /**
     * Procesa y envía el formulario de soporte/contacto.
     * POST /api/v1/shop/contact
     */
    public function send(Request $request)
    {
        $request->validate([
            'name' => 'required|string|min:2|max:120',
            'email' => 'required|email|max:150',
            'subject' => 'required|string|min:4|max:200',
            'message' => 'required|string|min:15|max:4000',
        ], [
            'name.required' => 'Por favor, ingresa tu nombre completo.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El formato del correo electrónico no es válido.',
            'subject.required' => 'Debes seleccionar el asunto de tu consulta.',
            'message.required' => 'Por favor, describe los detalles de tu consulta.',
            'message.min' => 'El mensaje debe contener al menos 15 caracteres con los detalles de tu situación.'
        ]);

        $inputEmail = strtolower(trim($request->email));

        // 1. Validar que la cuenta de usuario exista en la plataforma
        $user = User::where('email', $inputEmail)->first();

        if (!$user) {
            return response()->json([
                'message' => "No es posible enviar el mensaje: no existe ninguna cuenta registrada con el correo '{$inputEmail}'. Por favor, ingresa el correo de tu cuenta activa o regístrate en nuestra tienda para contactar a soporte."
            ], 422);
        }

        // Si el usuario está autenticado, su correo debe coincidir con su sesión
        if (auth('sanctum')->check()) {
            $authUser = auth('sanctum')->user();
            if (strtolower($authUser->email) !== $inputEmail) {
                return response()->json([
                    'message' => 'El correo ingresado no coincide con la cuenta activa con la que iniciaste sesión.'
                ], 422);
            }
        }

        // 2. Obtener el correo destinatario de soporte
        $recipientEmail = SystemSetting::where('key', 'contact_email')->value('value')
            ?? config('mail.from.address', 'contacto@voxman.shop');

        $cleanName = trim($request->name);
        $cleanSubject = trim($request->subject);
        $cleanMessage = trim($request->message);

        try {
            Mail::to($recipientEmail)->send(new ContactSupportMail(
                $cleanName,
                $inputEmail,
                $cleanSubject,
                $cleanMessage
            ));

            return response()->json([
                'message' => "¡Tu mensaje ha sido enviado exitosamente al equipo de soporte! Te responderemos a {$inputEmail} a la brevedad posible."
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Error enviando correo de contacto a soporte: ' . $e->getMessage(), [
                'exception' => $e,
                'email' => $inputEmail,
                'subject' => $cleanSubject
            ]);

            return response()->json([
                'message' => 'Tuvimos un problema temporal al despachar el correo hacia nuestro buzón de soporte. Por favor, intenta de nuevo o contáctanos por WhatsApp.'
            ], 500);
        }
    }
}
