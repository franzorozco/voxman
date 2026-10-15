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

        if (in_array($cart->status, ['ordered', 'converted', 'completed', 'cancelled', 'disabled', 'inactive'], true)) {
            return;
        }

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

        // Detalles de entrega limpios (sin "null" ni "undefined")
        $deliveryDetails = $discountService->formatCleanDeliveryDetails($cart->delivery_details);

        // Número de referencia
        $referenceNumber = $cart->reference_number ?? substr($cart->id, 0, 8);

        // Limpiar el número de teléfono (quitar +, espacios)
        $cleanPhone = preg_replace('/[^0-9]/', '', $customerPhone);
        $whatsappLink = $cleanPhone ? "https://wa.me/{$cleanPhone}" : '#';
        
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $cartLink = $frontendUrl . "/dashboard/carts?open_cart=" . $cart->id;

        // Validar y calcular stock, precios, descuentos individuales, descuento global y prorrateo en tiempo real
        $cartCalculation = $discountService->calculateAndValidateCart($cart);
        $discountCode = $cartCalculation['discount_code'] ?? 'Ninguno';
        $globalDiscountExpired = $cartCalculation['global_discount_expired'] ?? false;
        $globalDiscountError = $cartCalculation['global_discount_error'] ?? null;

        // Agrupar items por owner
        $ownersData = [];

        foreach ($cartCalculation['items'] as $vItem) {
            $item = $vItem['item'];
            $variant = $vItem['variant'];
            $owner = $variant->product->owner ?? null;
            if (!$owner || !$owner->user) continue;

            $ownerId = $owner->id;
            
            if (!isset($ownersData[$ownerId])) {
                $ownersData[$ownerId] = [
                    'email' => $owner->notification_email ?? $owner->user->email,
                    'name' => $owner->user->name ?? $owner->user->username,
                    'items' => [],
                    'subtotal' => 0.0,
                    'discount' => 0.0,
                    'totalAmount' => 0.0,
                    'hasStockIssues' => false,
                ];
            }

            if (!$vItem['has_stock']) {
                $ownersData[$ownerId]['hasStockIssues'] = true;
            }

            $lineSubtotal = (float) $vItem['calculated_subtotal'];
            $lineGlobalDiscount = (float) $vItem['prorated_global_discount'];
            $netLineTotal = (float) $vItem['net_line_total'];

            $ownersData[$ownerId]['items'][] = [
                'name' => $variant->product->name . ' (' . ($variant->name ?? 'Default') . ')',
                'sku' => $variant->sku ?? '',
                'quantity' => $item->quantity,
                'unit_price' => $vItem['calculated_unit_price'],
                'original_price' => $vItem['original_unit_price'],
                'has_discount' => $vItem['has_active_discount'],
                'discount_expired' => $vItem['discount_is_expired'],
                'discount_label' => $vItem['discount_label'],
                'line_subtotal' => $lineSubtotal,
                'prorated_global_discount' => $lineGlobalDiscount,
                'net_line_total' => $netLineTotal,
                'available_stock' => $vItem['available_stock'],
                'stock_status' => $vItem['stock_status'],
                'has_stock' => $vItem['has_stock'],
            ];
            
            $ownersData[$ownerId]['subtotal'] = round($ownersData[$ownerId]['subtotal'] + $lineSubtotal, 2);
            $ownersData[$ownerId]['discount'] = round($ownersData[$ownerId]['discount'] + $lineGlobalDiscount, 2);
            $ownersData[$ownerId]['totalAmount'] = round($ownersData[$ownerId]['totalAmount'] + $netLineTotal, 2);
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
                            $data['hasStockIssues'] ?? false,
                            $data['discount'] ?? 0,
                            $discountCode,
                            $globalDiscountExpired,
                            $globalDiscountError
                        )
                    );
                } catch (\Exception $e) {
                    Log::error("Failed to send cart reminder email to {$data['email']}: " . $e->getMessage());
                }
            }
        }
    }
}
