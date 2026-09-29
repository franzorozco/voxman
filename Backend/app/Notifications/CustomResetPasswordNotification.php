<?php

namespace App\Notifications;

use App\Models\System\SystemSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class CustomResetPasswordNotification extends Notification
{
    use Queueable;

    public string $token;
    public string $email;

    public function __construct(string $token, string $email)
    {
        $this->token = $token;
        $this->email = $email;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $resetUrl    = $frontendUrl . '/reset-password/' . $this->token . '?email=' . urlencode($this->email);
        $appUrl      = env('APP_URL', 'http://localhost:8000');
        $storageBase = rtrim(env('AWS_URL', ''), '/');

        // Logos desde system_settings (con fallback a las URLs fijas)
        $logos = SystemSetting::whereIn('key', ['store_logo_dark', 'store_logo_light'])
            ->pluck('value', 'key');

        // store_logo_dark → letra blanca, para el header oscuro
        $logoHeaderUrl = $logos->has('store_logo_dark')
            ? $storageBase . '/' . ltrim($logos['store_logo_dark'], '/')
            : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/logos/1de4b12f-f908-4081-a2c0-3afa8902ec7f.png';

        // store_logo_light → letra negra, para la firma sobre fondo blanco
        $logoSignatureUrl = $logos->has('store_logo_light')
            ? $storageBase . '/' . ltrim($logos['store_logo_light'], '/')
            : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/logos/526f4e85-7036-49c5-aa50-5756c8c0d43b.png';

        return (new MailMessage)
            ->from('soporte@voxman.shop', 'Soporte VOXMAN')
            ->subject('Recuperación de contraseña — VOXMAN')
            ->view('emails.reset_password', [
                'resetUrl'         => $resetUrl,
                'appUrl'           => $appUrl,
                'logoHeaderUrl'    => $logoHeaderUrl,
                'logoSignatureUrl' => $logoSignatureUrl,
            ]);
    }
}
