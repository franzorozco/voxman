<?php

namespace App\Mail;

use App\Models\System\SystemSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewOrderToOwner extends Mailable
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
    public $discountCode;
    public $items;
    public $subtotal;
    public $discount;
    public $totalAmount;
    public $otherOwnersText;

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
        $discountCode,
        $items, 
        $subtotal, 
        $discount, 
        $totalAmount,
        $otherOwnersText = ''
    ) {
        $this->ownerName = $ownerName;
        $this->customerFullName = $customerFullName;
        $this->customerCode = $customerCode;
        $this->customerEmail = $customerEmail;
        $this->customerType = $customerType;
        $this->cartLink = $cartLink;
        $this->referenceNumber = $referenceNumber;
        $this->whatsappLink = $whatsappLink;
        $this->deliveryDetails = $deliveryDetails;
        $this->discountCode = $discountCode;
        $this->items = $items;
        $this->subtotal = $subtotal;
        $this->discount = $discount;
        $this->totalAmount = $totalAmount;
        $this->otherOwnersText = $otherOwnersText;
    }

    public function envelope(): Envelope
    {
        $storeName = \App\Models\System\SystemSetting::where('key', 'store_name')->first()->value ?? 'VOXMAN';

        return new Envelope(
            from: new Address('soporte@voxman.shop', $storeName),
            subject: 'RECIBISTE UNA NUEVA ORDEN - ' . $storeName,
        );
    }

    public function content(): Content
    {
        $appUrl = env('APP_URL', 'http://localhost:8000');
        $storageBase = rtrim(env('AWS_URL', ''), '/');

        // Logos (mimicking reset_password logic)
        $settings = SystemSetting::whereIn('key', ['store_logo_dark', 'store_logo_light', 'store_name', 'store_phone', 'instagram_url', 'tiktok_url', 'facebook_url', 'store_address'])->pluck('value', 'key');
        
        $logoHeaderUrl = $settings->has('store_logo_dark')
            ? $storageBase . '/' . ltrim($settings['store_logo_dark'], '/')
            : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/logos/1de4b12f-f908-4081-a2c0-3afa8902ec7f.png';

        $logoSignatureUrl = $settings->has('store_logo_light')
            ? $storageBase . '/' . ltrim($settings['store_logo_light'], '/')
            : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/logos/526f4e85-7036-49c5-aa50-5756c8c0d43b.png';

        $storeName = $settings['store_name'] ?? 'VOXMAN';
        $storePhone = $settings['store_phone'] ?? '';
        $instagramUrl = $settings['instagram_url'] ?? '';
        $tiktokUrl = $settings['tiktok_url'] ?? '';
        $facebookUrl = $settings['facebook_url'] ?? '';
        $storeAddress = $settings['store_address'] ?? '';

        return new Content(
            view: 'emails.new_order_owner',
            with: [
                'appUrl' => $appUrl,
                'logoHeaderUrl' => $logoHeaderUrl,
                'logoSignatureUrl' => $logoSignatureUrl,
                'storeName' => $storeName,
                'storePhone' => $storePhone,
                'instagramUrl' => $instagramUrl,
                'tiktokUrl' => $tiktokUrl,
                'facebookUrl' => $facebookUrl,
                'storeAddress' => $storeAddress,
            ],
        );
    }
}



