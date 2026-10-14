<?php

namespace App\Jobs;

use App\Models\Sales\Cart;
use App\Mail\CartReminderToOwner;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendCartReminderOwnerEmails implements ShouldQueue
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
            'items.variant.product.category',
            'items.variant.product.brand',
            'items.variant.inventories',
            'items.variant.size',
            'items.variant.fit',
            'items.variant.variant_attribute_values.attribute_value.attribute',
            'items.appliedDiscount',
            'discount',
            'guest', 
            'customer.user.profile'
        ])->find($this->cartId);

        if (!$cart) return;

        $discountService = app(\App\Services\Finance\DiscountValidationService::class);

        // Determinar si está expirado o abandonado
        $isExpired = ($cart->status === 'abandoned') || ($cart->expires_at && $cart->expires_at->isPast());

        // Determinar datos del cliente
        $customerCode = 'N/A';
        $customerFullName = 'Desconocido';
        $customerPhone = '';
        $customerEmail = 'No registrado';
        $customerType = 'DESCONOCIDO';

        if ($cart->guest) {
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

        // Número de referencia
        $referenceNumber = $cart->reference_number ?? substr($cart->id, 0, 8);

        // Limpiar el número de teléfono (quitar +, espacios)
        $cleanPhone = preg_replace('/[^0-9]/', '', $customerPhone);
        $whatsappLink = $cleanPhone ? "https://wa.me/{$cleanPhone}" : '#';
        
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $cartLink = $frontendUrl . "/dashboard/carts?open_cart=" . $cart->id;

        // Agrupar items por owner
        $ownersData = [];

        foreach ($cart->items as $item) {
            $variant = $item->variant;
            $owner = $variant->product->owner ?? null;
            if (!$owner || !$owner->user) continue;

            $ownerId = $owner->id;
            
            if (!isset($ownersData[$ownerId])) {
                $ownersData[$ownerId] = [
                    'email' => $owner->notification_email ?? $owner->user->email,
                    'name' => $owner->user->name ?? $owner->user->username,
                    'items' => [],
                    'subtotal' => 0,
                    'totalAmount' => 0,
                    'hasStockIssues' => false,
                ];
            }

            // Validación de stock en tiempo real
            $availableStock = $variant ? (int) $variant->inventories->sum('stock') : 0;
            if (!$variant || !$variant->is_active || $variant->trashed()) {
                $stockStatus = 'unavailable';
                $hasStock = false;
            } elseif ($availableStock <= 0) {
                $stockStatus = 'out_of_stock';
                $hasStock = false;
            } elseif ($availableStock < $item->quantity) {
                $stockStatus = 'insufficient';
                $hasStock = false;
            } else {
                $stockStatus = 'in_stock';
                $hasStock = true;
            }

            if (!$hasStock) {
                $ownersData[$ownerId]['hasStockIssues'] = true;
            }

            // Validación de precios y descuentos en tiempo real
            $basePrice = (float) ($variant->price ?? $item->original_price ?? 0);
            $originalUnitPrice = (float) ($item->original_price ?: $basePrice);
            $hasDiscount = false;
            $discountExpired = false;
            $discountLabel = null;
            $calculatedUnitPrice = $basePrice;

            if (!empty($item->applied_discount_id)) {
                $discountResult = $discountService->validateItemDiscount($item->applied_discount_id, $variant, $cart->customer_id);
                if ($discountResult['valid']) {
                    $discountObj = $discountResult['discount'];
                    if ($discountObj->type === 'percentage') {
                        $discVal = round($basePrice * ($discountObj->value / 100), 2);
                        $calculatedUnitPrice = max(0, $basePrice - $discVal);
                    } else {
                        $discVal = min($basePrice, (float) $discountObj->value);
                        $calculatedUnitPrice = max(0, $basePrice - $discVal);
                    }
                    $hasDiscount = true;
                    $discountLabel = $item->discount_label ?: ($discountObj->type === 'percentage' ? "-{$discountObj->value}%" : "-Bs. " . number_format($discountObj->value, 2));
                } else {
                    $discountExpired = true;
                    $calculatedUnitPrice = $basePrice;
                }
            } elseif ($item->override_price !== null) {
                $calculatedUnitPrice = (float) $item->override_price;
            }

            $lineSubtotal = round($calculatedUnitPrice * $item->quantity, 2);

            $ownersData[$ownerId]['items'][] = [
                'name' => $variant->product->name . ' (' . ($variant->name ?? 'Default') . ')',
                'sku' => $variant->sku ?? '',
                'quantity' => $item->quantity,
                'unit_price' => $calculatedUnitPrice,
                'original_price' => $originalUnitPrice,
                'has_discount' => $hasDiscount,
                'discount_expired' => $discountExpired,
                'discount_label' => $discountLabel,
                'line_subtotal' => $lineSubtotal,
                'available_stock' => $availableStock,
                'stock_status' => $stockStatus,
                'has_stock' => $hasStock,
            ];
            
            $ownersData[$ownerId]['subtotal'] += $lineSubtotal;
            $ownersData[$ownerId]['totalAmount'] += $lineSubtotal;
        }

        // Obtener todos los nombres de owners
        $allOwnerNames = array_map(function($data) { return $data['name']; }, $ownersData);

        // Enviar correos
        foreach ($ownersData as $data) {
            $otherOwners = array_filter($allOwnerNames, function($name) use ($data) { return $name !== $data['name']; });
            $otherOwnersText = empty($otherOwners) ? '' : 'Esta orden está en conjunto con productos de: ' . implode(', ', $otherOwners);

            if (filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                try {
                    Mail::to($data['email'])->send(
                        new CartReminderToOwner(
                            $data['name'],
                            $customerFullName,
                            $customerCode,
                            $customerEmail,
                            $customerType,
                            $cartLink,
                            $referenceNumber,
                            $whatsappLink,
                            $deliveryDetails,
                            $data['items'],
                            $data['subtotal'],
                            $data['totalAmount'],
                            $otherOwnersText,
                            $isExpired,
                            $data['hasStockIssues'] ?? false
                        )
                    );
                } catch (\Exception $e) {
                    Log::error("Failed to send cart reminder email to {$data['email']}: " . $e->getMessage());
                }
            }
        }
    }
}
