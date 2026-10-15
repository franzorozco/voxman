<?php

namespace App\Mail;

use App\Models\System\SystemSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactSupportMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $clientName;
    public string $clientEmail;
    public string $subjectText;
    public string $messageBody;
    public string $storeName;
    public string $logoHeaderUrl;
    public string $appUrl;

    public function __construct(string $clientName, string $clientEmail, string $subjectText, string $messageBody)
    {
        $this->clientName   = $clientName;
        $this->clientEmail  = $clientEmail;
        $this->subjectText  = $subjectText;
        $this->messageBody  = $messageBody;

        $this->appUrl       = env('APP_URL', 'http://localhost:8000');
        $storageBase        = rtrim(env('AWS_URL', ''), '/');

        $settings = SystemSetting::whereIn('key', [
            'store_logo_dark', 'store_name'
        ])->pluck('value', 'key');

        $this->storeName = $settings['store_name'] ?? 'VOXman';

        $this->logoHeaderUrl = $settings->has('store_logo_dark')
            ? $storageBase . '/' . ltrim($settings['store_logo_dark'], '/')
            : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/logos/1de4b12f-f908-4081-a2c0-3afa8902ec7f.png';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(config('mail.from.address', 'soporte@voxman.shop'), $this->storeName),
            replyTo: [
                new Address($this->clientEmail, $this->clientName)
            ],
            subject: "[Soporte {$this->storeName}] {$this->subjectText} — {$this->clientName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact_support',
            with: [
                'clientName'    => $this->clientName,
                'clientEmail'   => $this->clientEmail,
                'subjectText'   => $this->subjectText,
                'messageBody'   => $this->messageBody,
                'storeName'     => $this->storeName,
                'logoHeaderUrl' => $this->logoHeaderUrl,
                'appUrl'        => $this->appUrl,
            ]
        );
    }
}
