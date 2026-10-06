<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Base\Guest;
use App\Models\Sales\Sale;
use App\Models\Sales\SaleDetail;
use App\Models\Sales\Returns;
use Illuminate\Support\Str;

class ShopReturnController extends Controller
{
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
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);

        $sale = Sale::with([
                'sale_details.product_variant.product.product_images',
                'sale_details.product_variant.product.attribute_value_images',
                'sale_details.product_variant.variant_images',
                'sale_details.product_variant.variant_attribute_values.attribute_value',
                'sale_details.product_variant.size',
                'sale_details.product_variant.fit',
                'sale_details.return_request',
                'guest'
            ])
            ->where(function ($q) use ($invoiceOrDelivery) {
                $q->where('invoice_number', $invoiceOrDelivery)
                  ->orWhereHas('shipments', function ($sq) use ($invoiceOrDelivery) {
                      $sq->where('delivery_code', $invoiceOrDelivery);
                  });
            })
            ->first();

        // Si se encontró, validamos el teléfono en PHP para evitar problemas con REGEXP_REPLACE en algunas versiones de DB
        $phoneIsValid = false;
        
        \Log::info('Return Lookup Data:', ['inputPhone' => $phone, 'inputInvoice' => $invoiceOrDelivery, 'saleFound' => (bool)$sale, 'saleHasGuest' => $sale ? (bool)$sale->guest : false]);

        if ($sale && $sale->guest) {
            $cleanInputPhone = preg_replace('/[^0-9]/', '', $phone);
            $cleanGuestPhone = preg_replace('/[^0-9]/', '', $sale->guest->whatsapp_phone);
            
            \Log::info('Return Lookup Phones:', ['cleanInputPhone' => $cleanInputPhone, 'cleanGuestPhone' => $cleanGuestPhone]);

            if (str_contains($cleanGuestPhone, $cleanInputPhone) || str_contains($cleanInputPhone, $cleanGuestPhone)) {
                $phoneIsValid = true;
            }
        }

        if (!$sale || !$phoneIsValid) {
            \Log::info('Return Lookup Failed:', ['phoneIsValid' => $phoneIsValid]);
            return response()->json([
                'message' => 'No pudimos encontrar una compra con esos datos. Verifica que el número de WhatsApp y el código de entrega/venta sean correctos.'
            ], 404);
        }

        // Filtramos items: (Opcional: excluir los que ya tienen return activo completo)
        // Para simplificar devolvemos todos, y el frontend indica si ya hay devoluciones.
        return response()->json([
            'sale' => $sale,
            'message' => 'Compra encontrada.'
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
            'reason' => 'required|string',
            'whatsapp_phone' => 'nullable|string'
        ]);

        $saleDetail = SaleDetail::with('sale.guest')->findOrFail($request->sale_detail_id);
        $sale = $saleDetail->sale;

        // Verificación de seguridad
        if (auth('sanctum')->check()) {
            $user = auth('sanctum')->user();
            // Validar que la venta es de este user
            if (!$sale->customer || $sale->customer->user_id !== $user->id) {
                return response()->json(['message' => 'No tienes permiso para devolver este artículo.'], 403);
            }
        } else {
            // Es un guest, requerimos que el whatsapp_phone mandado coincida
            if (!$request->whatsapp_phone) {
                return response()->json(['message' => 'El número de teléfono es obligatorio para usuarios invitados.'], 400);
            }
            if (!$sale->guest) {
                return response()->json(['message' => 'Esta compra no corresponde a un usuario invitado válido.'], 403);
            }
            
            $cleanInputPhone = preg_replace('/[^0-9]/', '', $request->whatsapp_phone);
            $cleanGuestPhone = preg_replace('/[^0-9]/', '', $sale->guest->whatsapp_phone);
            
            if (!str_contains($cleanGuestPhone, $cleanInputPhone) && !str_contains($cleanInputPhone, $cleanGuestPhone)) {
                return response()->json(['message' => 'Validación de seguridad fallida.'], 403);
            }
        }

        // Validar si la venta está en estado completed/delivered
        // Opcional: Descomentar si se quiere forzar
        // if (!in_array($sale->status, ['completed', 'delivered'])) {
        //     return response()->json(['message' => 'Solo puedes devolver pedidos que ya fueron entregados.'], 400);
        // }

        // Check if quantity to return is valid
        $existingReturns = Returns::where('sale_detail_id', $saleDetail->id)
                                  ->whereIn('status', ['pending', 'inspection', 'approved'])
                                  ->sum('quantity');
        
        $availableQuantity = $saleDetail->quantity - $existingReturns;

        if ($request->quantity > $availableQuantity) {
            return response()->json(['message' => 'La cantidad a devolver excede la cantidad disponible de este artículo.'], 400);
        }

        $return = Returns::create([
            'sale_detail_id' => $saleDetail->id,
            'quantity' => $request->quantity,
            'reason' => $request->reason,
            'reference_number' => 'RET-' . strtoupper(Str::random(8)),
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Solicitud de devolución enviada correctamente. Nuestro equipo se pondrá en contacto pronto.',
            'return' => $return
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
