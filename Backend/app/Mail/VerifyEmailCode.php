<?php

namespace App\Mail;

use App\Models\System\SystemSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerifyEmailCode extends Mailable
{
    use Queueable, SerializesModels;

    public string $customerName;
    public string $customerEmail;
    public string $verificationCode;
    public int $expiresInMinutes;

    public function __construct(
        string $customerName,
        string $customerEmail,
        string $verificationCode,
        int $expiresInMinutes = 1440
    ) {
        $this->customerName     = $customerName;
        $this->customerEmail    = $customerEmail;
        $this->verificationCode = $verificationCode;
        $this->expiresInMinutes = $expiresInMinutes;
    }

    public function envelope(): Envelope
    {
        $storeName = SystemSetting::where('key', 'store_name')->first()->value ?? 'VOXMAN';
        $fromAddress = config('mail.from.address') ?: env('MAIL_FROM_ADDRESS', 'soporte@voxman.shop');

        return new Envelope(
            from: new Address($fromAddress, '' . $storeName),
            subject: 'Verifica tu correo electrónico — ' . $storeName,
        );
    }

    public function content(): Content
    {
        $appUrl      = env('APP_URL', 'http://localhost:8000');
        $frontendUrl = rtrim(env('FRONTEND_URL', $appUrl), '/');
        $storageBase = rtrim(env('AWS_URL', ''), '/');

        $settings = SystemSetting::whereIn('key', [
            'store_logo_dark',
            'store_logo_light',
            'store_name',
            'store_phone',
            'instagram_url',
            'tiktok_url',
            'facebook_url',
            'store_address',
        ])->pluck('value', 'key');

        $logoHeaderUrl = $settings->has('store_logo_dark')
            ? $storageBase . '/' . ltrim($settings['store_logo_dark'], '/')
            : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/logos/1de4b12f-f908-4081-a2c0-3afa8902ec7f.png';

        $logoSignatureUrl = $settings->has('store_logo_light')
            ? $storageBase . '/' . ltrim($settings['store_logo_light'], '/')
            : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/logos/526f4e85-7036-49c5-aa50-5756c8c0d43b.png';

        $verifyUrl = $frontendUrl . '/profile?verify_code=' . urlencode($this->verificationCode) . '&email=' . urlencode($this->customerEmail);

        return new Content(
            view: 'emails.verify_email_code',
            with: [
                'appUrl'           => $appUrl,
                'frontendUrl'      => $frontendUrl ?: $appUrl,
                'logoHeaderUrl'    => $logoHeaderUrl,
                'logoSignatureUrl' => $logoSignatureUrl,
                'storeName'        => $settings['store_name'] ?? 'VOXMAN',
                'storePhone'       => $settings['store_phone'] ?? '',
                'instagramUrl'     => $settings['instagram_url'] ?? '',
                'tiktokUrl'        => $settings['tiktok_url'] ?? '',
                'facebookUrl'      => $settings['facebook_url'] ?? '',
                'storeAddress'     => $settings['store_address'] ?? '',
                // verification data
                'customerName'     => $this->customerName,
                'customerEmail'    => $this->customerEmail,
                'verificationCode' => $this->verificationCode,
                'expiresInMinutes' => $this->expiresInMinutes,
                'verifyUrl'        => $verifyUrl,
            ],
        );
    }
}
