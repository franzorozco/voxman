<?php

namespace App\Jobs;

use App\Models\Sales\Cart;
use App\Mail\NewOrderToOwner;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendNewOrderOwnerEmails implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [10, 30, 60];

    protected $cartId;

    public function __construct($cartId)
    {
        $this->cartId = $cartId;
    }

    public function handle()
    {
        $cart = Cart::with([
            'items.variant.product.owner.user', 
            'items.variant.size',
            'items.variant.fit',
            'items.variant.variant_attribute_values.attribute_value.attribute',
            'guest', 
            'customer.user.profile'
        ])->find($this->cartId);

        if (!$cart) return;

        // Determinar datos del cliente
        $customerCode = 'N/A';
        $customerFullName = 'Desconocido';
        $customerPhone = '';
        $customerEmail = 'No registrado';
        $customerType = 'DESCONOCIDO';

        if ($cart->guest) {
            $customerName = $cart->guest->name;
            $customerFullName = $cart->guest->name;
            $customerType = 'CLIENTE RÁPIDO';
            $customerPhone = $cart->guest->whatsapp_phone;
            $customerEmail = $cart->guest->email ?? 'No registrado';
        } else if ($cart->customer) {
            $prof = $cart->customer->user->profile ?? null;
            
            $customerName = $cart->customer->user->name ?? ($prof->first_name ?? 'Desconocido');
            $customerFullName = trim(($prof->first_name ?? '') . ' ' . ($prof->last_name_paternal ?? '') . ' ' . ($prof->last_name_maternal ?? ''));
            if (!$customerFullName) $customerFullName = $customerName;
            
            $customerCode = $cart->customer->customer_code ?? 'N/A';
            $customerType = $cart->source === 'pos' ? 'CLIENTE POS' : 'CLIENTE WEB';
            $customerPhone = $prof->phone ?? '';
            $customerEmail = $cart->customer->user->email ?? 'No registrado';
        }

        // Detalles de entrega
        $deliveryDetails = 'No especificado';
        if (!empty($cart->delivery_details) && is_array($cart->delivery_details)) {
            $dd = $cart->delivery_details;
            $typeText = $dd['text'] ?? ($dd['type'] === 'pickup' ? 'Recojo en sucursal' : 'Envío a domicilio');
            $address = $dd['address'] ?? '';
            $deliveryDetails = trim($typeText . ($address ? " - " . $address : ""));
        }

        // Descuento
        $discountCode = $cart->discount->code ?? 'Ninguno';

        // Número de referencia
        $referenceNumber = $cart->reference_number ?? substr($cart->id, 0, 8);

        // Limpiar el número de teléfono (quitar +, espacios)
        $cleanPhone = preg_replace('/[^0-9]/', '', $customerPhone);
        $whatsappLink = $cleanPhone ? "https://wa.me/{$cleanPhone}" : '#';
        
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $cartLink = $frontendUrl . "/dashboard/carts?open_cart=" . $cart->id;

        // --- CALCULAR DESCUENTOS PRORRATEADOS USANDO EL SERVICIO ---
        $discountService = app(\App\Services\Finance\DiscountValidationService::class);
        $totalDiscount = $cart->total_discount ?? $cart->dynamic_global_discount;
        $cartSubtotal = $cart->dynamic_subtotal;

        $itemsForProration = [];
        foreach ($cart->items as $item) {
            $itemsForProration[] = [
                'bundle_group_id' => $item->bundle_group_id,
                'applied_discount_id' => $item->applied_discount_id,
                'discount_label' => $item->discount_label,
                'line_subtotal' => $item->dynamic_subtotal
            ];
        }

        $proratedDiscounts = $discountService->prorateDiscountToItems($itemsForProration, $totalDiscount, $cartSubtotal);

        // Agrupar items por owner
        $ownersData = [];

        foreach ($cart->items as $index => $item) {
            $owner = $item->variant->product->owner ?? null;
            if (!$owner || !$owner->user) continue;

            $ownerId = $owner->id;
            
            if (!isset($ownersData[$ownerId])) {
                $ownersData[$ownerId] = [
                    'email' => $owner->notification_email ?? $owner->user->email,
                    'name' => $owner->user->name ?? $owner->user->username,
                    'items' => [],
                    'subtotal' => 0,
                    'discount' => 0,
                    'totalAmount' => 0
                ];
            }

            $lineSubtotal = $item->dynamic_subtotal;
            $lineDiscount = $proratedDiscounts[$index] ?? 0;
            $hasIndividualDiscount = !empty($item->applied_discount_id) || !empty($item->discount_label);

            $ownersData[$ownerId]['items'][] = [
                'name' => $item->variant->product->name . ' (' . ($item->variant->name ?? 'Default') . ')',
                'quantity' => $item->quantity,
                'unit_price' => $item->dynamic_unit_price,
                'line_subtotal' => $lineSubtotal,
                'has_individual_discount' => $hasIndividualDiscount,
                'discount_label' => $item->discount_label ?? ''
            ];
            
            $ownersData[$ownerId]['subtotal'] += $lineSubtotal;
            $ownersData[$ownerId]['discount'] += $lineDiscount;
            $ownersData[$ownerId]['totalAmount'] += ($lineSubtotal - $lineDiscount);
        }

        // Obtener todos los nombres de owners
        $allOwnerNames = array_map(function($data) { return $data['name']; }, $ownersData);

        // Enviar correos
        $hasErrors = false;
        foreach ($ownersData as $data) {
            $otherOwners = array_filter($allOwnerNames, function($name) use ($data) { return $name !== $data['name']; });
            $otherOwnersText = empty($otherOwners) ? '' : 'Esta orden está en conjunto con productos de: ' . implode(', ', $otherOwners);

            if (filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                try {
                    Mail::to($data['email'])->send(
                        new NewOrderToOwner(
                            $data['name'],
                            $customerFullName,
                            $customerCode,
                            $customerEmail,
                            $customerType,
                            $cartLink,
                            $referenceNumber,
                            $whatsappLink,
                            $deliveryDetails,
                            $discountCode,
                            $data['items'],
                            $data['subtotal'],
                            $data['discount'],
                            $data['totalAmount'],
                            $otherOwnersText
                        )
                    );
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to send order email to {$data['email']}: " . $e->getMessage());
                    $hasErrors = true;
                }
            }
        }

        if ($hasErrors) {
            throw new \Exception("One or more order emails failed to send. Check logs for details.");
        }
    }
}
