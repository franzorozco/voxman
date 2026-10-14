<?php

namespace App\Mail;

use App\Models\System\SystemSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Correo enviado a cada owner de los productos del carrito,
 * notificando que el cliente solicita reactivación (carrito vencido)
 * o quiere agendar la entrega (carrito activo/proforma).
 */
class CartReminderToOwner extends Mailable
{
    use Queueable, SerializesModels;

    public $ownerName;
    public $customerFullName;
    public $customerCode;
    public $customerEmail;
    public $customerType;
    public $cartLink;
    public $referenceNumber;
    public $whatsappLink;
    public $deliveryDetails;
    public $items;
    public $subtotal;
    public $totalAmount;
    public $otherOwnersText;
    public $isExpired;      // true = reactivar, false = agendar entrega
    public $hasStockIssues; // true si algún item del carrito/owner no tiene stock suficiente

    public function __construct(
        $ownerName,
        $customerFullName,
        $customerCode,
        $customerEmail,
        $customerType,
        $cartLink,
        $referenceNumber,
        $whatsappLink,
        $deliveryDetails,
        $items,
        $subtotal,
        $totalAmount,
        $otherOwnersText = '',
        $isExpired = false,
        $hasStockIssues = false
    ) {
        $this->ownerName         = $ownerName;
        $this->customerFullName  = $customerFullName;
        $this->customerCode      = $customerCode;
        $this->customerEmail     = $customerEmail;
        $this->customerType      = $customerType;
        $this->cartLink          = $cartLink;
        $this->referenceNumber   = $referenceNumber;
        $this->whatsappLink      = $whatsappLink;
        $this->deliveryDetails   = $deliveryDetails;
        $this->items             = $items;
        $this->subtotal          = $subtotal;
        $this->totalAmount       = $totalAmount;
        $this->otherOwnersText   = $otherOwnersText;
        $this->isExpired         = $isExpired;
        $this->hasStockIssues    = $hasStockIssues;
    }

    public function envelope(): Envelope
    {
        $storeName = SystemSetting::where('key', 'store_name')->first()->value ?? 'VOXMAN';
        $subject = $this->isExpired
            ? 'SOLICITUD DE REACTIVACIÓN DE CARRITO — ' . $storeName
            : 'RECORDATORIO DE ENTREGA PENDIENTE — ' . $storeName;

        return new Envelope(
            from: new Address('soporte@voxman.shop', $storeName),
            subject: $subject,
        );
    }

    public function content(): Content
    {
        $appUrl      = env('APP_URL', 'http://localhost:8000');
        $storageBase = rtrim(env('AWS_URL', ''), '/');

        $settings = SystemSetting::whereIn('key', [
            'store_logo_dark', 'store_logo_light', 'store_name',
            'store_phone', 'instagram_url', 'tiktok_url', 'facebook_url', 'store_address'
        ])->pluck('value', 'key');

        $logoHeaderUrl = $settings->has('store_logo_dark')
            ? $storageBase . '/' . ltrim($settings['store_logo_dark'], '/')
            : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/logos/1de4b12f-f908-4081-a2c0-3afa8902ec7f.png';

        $logoSignatureUrl = $settings->has('store_logo_light')
            ? $storageBase . '/' . ltrim($settings['store_logo_light'], '/')
            : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/logos/526f4e85-7036-49c5-aa50-5756c8c0d43b.png';

        $storeName   = $settings['store_name']   ?? 'VOXMAN';
        $storePhone  = $settings['store_phone']  ?? '';
        $instagramUrl = $settings['instagram_url'] ?? '';
        $tiktokUrl   = $settings['tiktok_url']   ?? '';
        $facebookUrl = $settings['facebook_url'] ?? '';
        $storeAddress = $settings['store_address'] ?? '';

        return new Content(
            view: 'emails.cart_reminder_owner',
            with: [
                'appUrl'           => $appUrl,
                'logoHeaderUrl'    => $logoHeaderUrl,
                'logoSignatureUrl' => $logoSignatureUrl,
                'storeName'        => $storeName,
                'storePhone'       => $storePhone,
                'instagramUrl'     => $instagramUrl,
                'tiktokUrl'        => $tiktokUrl,
                'facebookUrl'      => $facebookUrl,
                'storeAddress'     => $storeAddress,
                'hasStockIssues'   => $this->hasStockIssues,
            ],
        );
    }
}
