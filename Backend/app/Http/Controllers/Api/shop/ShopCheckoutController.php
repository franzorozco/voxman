<?php

namespace App\Http\Controllers\Api\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Models\Base\Guest;
use App\Models\Sales\Cart;
use App\Models\Sales\CartItem;
use App\Models\Inventory\StockReservation;
use App\Models\Catalog\ProductVariant;
use Illuminate\Support\Str;

class ShopCheckoutController extends Controller
{
    public function initGuestCheckout(Request $request)
    {
        $request->validate([
            'name' => 'required|string|min:3',
            'whatsapp_phone' => 'required|string|min:7',
        ]);

        $cartToken = $request->header('X-Cart-Token');
        if (!$cartToken) {
            return response()->json(['message' => 'No cart token provided'], 400);
        }

        $cartDataJson = Cache::get("cart:{$cartToken}");
        if (!$cartDataJson) {
            return response()->json(['message' => 'El carrito está vacío o ha expirado'], 400);
        }

        $cartData = json_decode($cartDataJson, true);
        if (empty($cartData['items'])) {
            return response()->json(['message' => 'El carrito está vacío'], 400);
        }

        try {
            DB::beginTransaction();

            // 1. Validate Stock in real-time
            foreach ($cartData['items'] as $item) {
                if (isset($item['variant_id'])) {
                    $variant = ProductVariant::with(['inventories', 'product'])->find($item['variant_id']);
                    if (!$variant) {
                        return response()->json(['message' => 'Un producto del carrito ya no existe'], 400);
                    }
                    $availableStock = $variant->inventories->sum('stock');
                    if ($availableStock < $item['quantity']) {
                        return response()->json(['message' => 'No hay stock suficiente para ' . $variant->product->name], 400);
                    }
                }
            }

            // 2. Find or Create Guest by whatsapp_phone
            $guest = Guest::updateOrCreate(
                ['whatsapp_phone' => $request->whatsapp_phone],
                ['name' => $request->name]
            );

            // 2. Generate Reference Number & Create Cart
            do {
                $uniqueId = mt_rand(10000, 99999);
                $referenceNumber = 'ORD-' . $uniqueId;
            } while (Cart::where('reference_number', $referenceNumber)->exists());
            
            $cart = Cart::create([
                'guest_id' => $guest->id,
                'reference_number' => $referenceNumber,
                'source' => 'web',
                'status' => 'active',
                'expires_at' => now()->addHours(24),
            ]);

            // 4. Process Items
            foreach ($cartData['items'] as $item) {
                // Insert cart item
                CartItem::create([
                    'cart_id' => $cart->id,
                    'variant_id' => $item['variant_id'] ?? null,
                    'quantity' => $item['quantity'],
                ]);
            }

            // 4. Remove cart from Cache
            Cache::forget("cart:{$cartToken}");

            DB::commit();

            $waSetting = \App\Models\System\SystemSetting::where('key', 'whatsapp_orders')->first();
            $waNumber = $waSetting ? $waSetting->value : '59157003312';

            return response()->json([
                'message' => 'Checkout iniciado correctamente',
                'cart_id' => $cart->id,
                'guest_id' => $guest->id,
                'reference_number' => $cart->reference_number,
                'whatsapp_number' => $waNumber
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al procesar el checkout',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
