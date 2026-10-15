<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Base\Guest;
use App\Models\Sales\Sale;
use App\Models\Sales\SaleDetail;
use App\Models\Sales\Returns;
use Carbon\Carbon;
use Illuminate\Support\Str;

class ShopReturnController extends Controller
{
    /**
     * Valida si una venta está 100% concretada, entregada, pagada y dentro de plazo.
     * Retorna un string con el mensaje de error o null si es elegible.
     */
    private function validateSaleEligibility(Sale $sale): ?string
    {
        // 1. Estado de la venta no cancelada
        if ($sale->status === 'cancelled') {
            return 'Esta compra se encuentra cancelada y no admite solicitudes de devolución.';
        }

        // 2. Entrega completada (ni en camino, ni en preparación, ni pendiente)
        $shipments = $sale->relationLoaded('shipments') ? $sale->shipments : $sale->shipments()->get();
        if ($shipments->isNotEmpty()) {
            $hasIncompleteShipment = $shipments->contains(function ($s) {
                return $s->status !== 'delivered' && empty($s->delivered_at);
            });

            if ($hasIncompleteShipment) {
                return 'Este pedido aún no ha sido entregado (se encuentra en camino o en preparación). Solo se pueden solicitar devoluciones una vez que haya sido entregado.';
            }
        } elseif (!in_array($sale->status, ['completed', 'paid'], true)) {
            return 'Esta compra aún no ha sido completada en su totalidad.';
        }

        // 3. Pago 100% completado (todo el pago pagado y sin saldo pendiente)
        $payments = $sale->relationLoaded('payments') ? $sale->payments : $sale->payments()->get();
        $totalPaid = $payments->where('status', 'completed')->sum('amount');

        $shippingTotal = $shipments->sum(function ($s) {
            $cost = $s->shipping_payment_type !== 'collect' ? (float) ($s->shipping_cost ?? 0) : 0;
            return $cost + (float) ($s->agency_dispatch_cost ?? 0);
        });

        $grandTotal = (float) ($sale->total ?? $sale->dynamic_total) + $shippingTotal;
        $isFullyPaid = $sale->status === 'paid' || ($totalPaid >= $grandTotal && $grandTotal > 0);

        if (!$isFullyPaid) {
            return 'Esta compra tiene un saldo pendiente de pago. Solo se pueden solicitar devoluciones de compras con el pago 100% completado.';
        }

        // 4. Plazo máximo de devolución: 1 solo día (24 horas) a partir de la entrega
        $deliveryDate = $shipments->max('delivered_at');
        $referenceDate = $deliveryDate ? Carbon::parse($deliveryDate) : $sale->created_at;
        if ($referenceDate && Carbon::parse($referenceDate)->diffInHours(now()) > 24) {
            return 'El plazo permitido de 1 día (24 horas) tras la entrega para solicitar la devolución ha expirado.';
        }

        return null;
    }

    /**
     * Endpoint público: Los guests buscan su compra
     * POST /api/v1/shop/returns/lookup
     */
    public function lookup(Request $request)
    {
        $request->validate([
            'whatsapp_phone' => 'required|string',
            'invoice_number' => 'required|string'
        ]);

        $phone = $request->whatsapp_phone;
        $invoiceOrDelivery = $request->invoice_number;

        // Limpiar el teléfono para la búsqueda (quitar espacios, +, etc.)
        $cleanInputPhone = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($cleanInputPhone) < 7) {
            return response()->json([
                'message' => 'Por favor, ingresa un número de teléfono válido (al menos 7 dígitos).'
            ], 422);
        }

        $sale = Sale::with([
                'sale_details.product_variant.product.product_images',
                'sale_details.product_variant.product.attribute_value_images',
                'sale_details.product_variant.variant_images',
                'sale_details.product_variant.variant_attribute_values.attribute_value',
                'sale_details.product_variant.size',
                'sale_details.product_variant.fit',
                'sale_details.return_request',
                'guest',
                'shipments',
                'payments'
            ])
            ->where(function ($q) use ($invoiceOrDelivery) {
                $q->where('invoice_number', $invoiceOrDelivery)
                  ->orWhereHas('shipments', function ($sq) use ($invoiceOrDelivery) {
                      $sq->where('delivery_code', $invoiceOrDelivery);
                  });
            })
            ->first();

        $phoneIsValid = false;

        if ($sale && $sale->guest) {
            $cleanGuestPhone = preg_replace('/[^0-9]/', '', $sale->guest->whatsapp_phone);

            if (str_contains($cleanGuestPhone, $cleanInputPhone) || str_contains($cleanInputPhone, $cleanGuestPhone)) {
                $phoneIsValid = true;
            }
        }

        if (!$sale || !$phoneIsValid) {
            return response()->json([
                'message' => 'No pudimos encontrar una compra con esos datos. Verifica que el número de WhatsApp y el código de entrega/venta sean correctos.'
            ], 404);
        }

        // Validar elegibilidad de la venta (Concretada, Entregada, 100% Pagada, Dentro de plazo)
        $eligibilityError = $this->validateSaleEligibility($sale);
        if ($eligibilityError) {
            return response()->json([
                'message' => $eligibilityError
            ], 400);
        }

        // Validar que tenga al menos un artículo con variante elegible
        $hasEligibleVariant = $sale->sale_details->contains(function ($d) {
            $hasVar = !empty($d->variant_id) || !empty($d->product_variant_id) || !empty($d->product_variant);
            if (!$hasVar) return false;
            if ($d->return_request && $d->return_request->status !== 'rejected') {
                return (int)$d->return_request->quantity < (int)$d->quantity;
            }
            return true;
        });

        if (!$hasEligibleVariant) {
            return response()->json([
                'message' => 'Esta compra no tiene artículos con variantes disponibles para devolución (todos han sido devueltos o no cuentan con variantes).'
            ], 400);
        }

        return response()->json([
            'sale' => $sale,
            'message' => 'Compra encontrada y verificada exitosamente.'
        ]);
    }

    /**
     * POST /api/v1/shop/returns/request
     */
    public function requestReturn(Request $request)
    {
        $request->validate([
            'sale_detail_id' => 'required|exists:sale_details,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|min:10',
            'whatsapp_phone' => 'nullable|string'
        ], [
            'reason.min' => 'El motivo debe contener al menos 10 caracteres explicando la razón de la devolución.'
        ]);

        $saleDetail = SaleDetail::with([
            'sale.guest',
            'sale.customer',
            'sale.shipments',
            'sale.payments',
            'product_variant'
        ])->findOrFail($request->sale_detail_id);

        $sale = $saleDetail->sale;

        // 1. Verificación de seguridad y Correo Verificado
        if (auth('sanctum')->check()) {
            $user = auth('sanctum')->user();

            $isVerified = !empty($user->email_verified_at) || !empty($user->google_id) || !empty($user->is_email_verified);
            if (!$isVerified) {
                return response()->json([
                    'message' => 'Debes verificar tu correo electrónico antes de solicitar una devolución.'
                ], 403);
            }

            if (!$sale->customer || $sale->customer->user_id !== $user->id) {
                return response()->json([
                    'message' => 'No tienes permiso para devolver este artículo.'
                ], 403);
            }
        } else {
            // Usuario invitado
            if (!$request->whatsapp_phone) {
                return response()->json(['message' => 'El número de teléfono es obligatorio para usuarios invitados.'], 400);
            }
            if (!$sale->guest) {
                return response()->json(['message' => 'Esta compra no corresponde a un usuario invitado válido.'], 403);
            }

            $cleanInputPhone = preg_replace('/[^0-9]/', '', $request->whatsapp_phone);
            $cleanGuestPhone = preg_replace('/[^0-9]/', '', $sale->guest->whatsapp_phone);

            if (!str_contains($cleanGuestPhone, $cleanInputPhone) && !str_contains($cleanInputPhone, $cleanGuestPhone)) {
                return response()->json(['message' => 'Validación de seguridad telefónica fallida.'], 403);
            }
        }

        // 2. Solo se pueden seleccionar variables (variantes de producto)
        $variantId = $saleDetail->variant_id ?? $saleDetail->product_variant_id;
        if (!$variantId || !$saleDetail->product_variant) {
            return response()->json([
                'message' => 'Solo se pueden procesar devoluciones de productos con una variante específica (talla/color) seleccionada.'
            ], 400);
        }

        // 3. Validar que la venta esté concretada, entregada, 100% pagada y en plazo
        $eligibilityError = $this->validateSaleEligibility($sale);
        if ($eligibilityError) {
            return response()->json(['message' => $eligibilityError], 400);
        }

        // 4. Validar cantidad disponible
        $existingReturns = Returns::where('sale_detail_id', $saleDetail->id)
                                  ->whereIn('status', ['pending', 'inspection', 'approved'])
                                  ->sum('quantity');

        $availableQuantity = $saleDetail->quantity - $existingReturns;

        if ($request->quantity > $availableQuantity) {
            return response()->json([
                'message' => 'La cantidad a devolver (' . $request->quantity . ') excede la cantidad disponible de este artículo (' . $availableQuantity . ').'
            ], 400);
        }

        // 5. Cálculo del 75% del valor (la política estipula devolver únicamente el 75%)
        $unitPrice = (float) ($saleDetail->final_price ?? $saleDetail->unit_price ?? 0);
        $totalOriginal = round($unitPrice * $request->quantity, 2);
        $refundAmount = round($totalOriginal * 0.75, 2);

        $return = Returns::create([
            'sale_detail_id' => $saleDetail->id,
            'quantity' => $request->quantity,
            'reason' => trim($request->reason),
            'reference_number' => 'RET-' . strtoupper(Str::random(8)),
            'status' => 'pending',
            'refund_amount' => $refundAmount,
        ]);

        return response()->json([
            'message' => 'Solicitud de devolución registrada correctamente. Se procesará el 75% del valor (Bs. ' . number_format($refundAmount, 2) . ') previa inspección del estado de la prenda (sin uso y con etiquetas intactas).',
            'return' => $return,
            'refund_amount' => $refundAmount,
            'original_amount' => $totalOriginal
        ], 201);
    }

    /**
     * GET /api/v1/shop/returns/guest-status
     */
    public function guestStatus(Request $request)
    {
        $request->validate([
            'whatsapp_phone' => 'required|string',
            'reference_number' => 'required|string'
        ]);

        $phone = preg_replace('/[^0-9]/', '', $request->whatsapp_phone);

        $return = Returns::with([
            'sale_detail.product_variant.product'
        ])
        ->where('reference_number', strtoupper($request->reference_number))
        ->whereHas('sale_detail.sale.guest', function($q) use ($phone) {
            $q->whereRaw("REGEXP_REPLACE(whatsapp_phone, '[^0-9]', '') LIKE ?", ["%$phone%"]);
        })->first();

        if (!$return) {
            return response()->json(['message' => 'No encontramos ninguna devolución con esos datos.'], 404);
        }

        return response()->json(['return' => $return]);
    }
}
