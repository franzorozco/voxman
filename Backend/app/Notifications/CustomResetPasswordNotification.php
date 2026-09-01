<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomResetPasswordNotification extends Notification
{
    use Queueable;

    public $token;
    public $email;

    public function __construct($token, $email)
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
        $url = $frontendUrl . '/reset-password/' . $this->token . '?email=' . urlencode($this->email);

        return (new MailMessage)
            ->subject('Recuperación de contraseña - VOXMAN')
            ->greeting('¡Hola!')
            ->line('Estás recibiendo este correo porque solicitaste restablecer la contraseña de tu cuenta en VOXMAN.')
            ->action('Restablecer Contraseña', $url)
            ->line('Este enlace caducará en 60 minutos.')
            ->line('Si no solicitaste este cambio, puedes ignorar este correo sin preocuparte.')
            ->salutation('Saludos, el equipo de VOXMAN');
    }
}
