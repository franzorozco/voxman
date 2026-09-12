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

        $deliveryDetails = $request->input('delivery_details', []);
        $deliveryType = is_array($deliveryDetails) ? ($deliveryDetails['type'] ?? null) : null;
        if ($deliveryType) {
            $typeMap = [
                'delivery' => 'delivery_home',
                'meetup' => 'delivery_scheduled_point',
                'pickup' => 'delivery_pickup',
                'national' => 'delivery_national'
            ];
            $settingKey = $typeMap[$deliveryType] ?? null;
            if ($settingKey) {
                $isActive = \App\Models\System\SystemSetting::where('key', $settingKey)->value('value');
                if ($isActive === 'false') {
                    return response()->json(['message' => 'El método de entrega seleccionado no está disponible.'], 400);
                }
            }
        }

        $cartToken = $request->header('X-Cart-Token');
        if (!$cartToken) {
            return response()->json(['message' => 'No cart token provided'], 400);
        }

        $cartDataJson = Cache::get("cart:{$cartToken}");
        if (!$cartDataJson) {
            return response()->json(['message' => 'El carrito estÃ¡ vacÃ­o o ha expirado'], 400);
        }

        $cartData = json_decode($cartDataJson, true);
        if (empty($cartData['items'])) {
            return response()->json(['message' => 'El carrito estÃ¡ vacÃ­o'], 400);
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

            // 2. Generate Reference Number
            do {
                $uniqueId = mt_rand(10000, 99999);
                $referenceNumber = 'ORD-' . $uniqueId;
            } while (Cart::where('reference_number', $referenceNumber)->exists());

            // Calculate Subtotal & Extract Discount Data from Session
            $subtotal = 0;
            $discountItems = [];
            foreach ($cartData['items'] as $item) {
                $isBundle = !empty($item['bundle_group_id']);
                $overridePrice = $item['override_price'] ?? ($isBundle ? $item['price'] : null);
                $priceToUse = $overridePrice !== null ? (float) $overridePrice : (float) ($item['price'] ?? 0);
                $lineSubtotal = $priceToUse * $item['quantity'];
                $subtotal += $lineSubtotal;
                
                $discountItems[] = [
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'line_subtotal' => $lineSubtotal,
                    'bundle_group_id' => $item['bundle_group_id'] ?? null,
                    'discount_label' => $item['discount_label'] ?? null
                ];
            }

            // Secure Discount Validation
            $discountId = null;
            $totalDiscount = 0;
            $proratedDiscounts = [];

            if (isset($cartData['applied_global_discount'])) {
                $discountService = app(\App\Services\Finance\DiscountValidationService::class);
                $discountResult = $discountService->validateCode(
                    $cartData['applied_global_discount']['code'],
                    $subtotal,
                    $discountItems,
                    null, // No customer ID for guest
                    null
                );

                if (!$discountResult['valid']) {
                    DB::rollBack();
                    return response()->json(['message' => 'El cupón aplicado ya no es válido: ' . $discountResult['message']], 400);
                }

                $discountId = $discountResult['id'];
                $totalDiscount = $discountResult['discount_amount'];
                $proratedDiscounts = $discountService->prorateDiscountToItems($discountItems, $totalDiscount, $subtotal);
            }

            $cart = Cart::create([
                'guest_id' => $guest->id,
                'reference_number' => $referenceNumber,
                'source' => 'web',
                'delivery_details' => $request->input('delivery_details', null),
                'status' => 'active',
                'expires_at' => now()->addMinutes(60),
                'discount_id' => $discountId,
                'total_discount' => $totalDiscount,
            ]);

            // 4. Process Items
            foreach ($cartData['items'] as $index => $item) {
                $isBundle = !empty($item['bundle_group_id']);
                
                $overridePrice = null;
                if ($isBundle) {
                    $overridePrice = $item['override_price'] ?? (isset($item['original_price']) && $item['price'] != $item['original_price'] ? $item['price'] : null);
                }
                
                // Insert cart item adhering to strict rules
                CartItem::create([
                    'cart_id'         => $cart->id,
                    'variant_id'      => $item['variant_id'] ?? null,
                    'quantity'        => $item['quantity'],
                    'override_price'  => $overridePrice !== null ? (float) $overridePrice : null,
                    'original_price'  => isset($item['original_price'])  ? (float) $item['original_price']  : null,
                    'bundle_group_id' => $item['bundle_group_id'] ?? null,
                    'discount_amount' => 0, // Global prorated discounts do NOT go here
                    'applied_discount_id' => $item['applied_discount_id'] ?? null,
                    'discount_label'  => $item['discount_label'] ?? null,
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

        } catch (\Exception $e) { \Log::error("Checkout Error: " . $e->getMessage()); \Log::error($e->getTraceAsString());
            DB::rollBack();
            return response()->json([
                'message' => 'Error al procesar el checkout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

        public function initAuthCheckout(Request $request)
    {
        $user = $request->user();
        
        $customer = $user->customers()->first();
        if (!$customer) {
            return response()->json(['message' => 'El usuario no tiene perfil de cliente'], 400);
        }

        $deliveryDetails = $request->input('delivery_details', []);
        $deliveryType = is_array($deliveryDetails) ? ($deliveryDetails['type'] ?? null) : null;
        if ($deliveryType) {
            $typeMap = [
                'delivery' => 'delivery_home',
                'meetup' => 'delivery_scheduled_point',
                'pickup' => 'delivery_pickup',
                'national' => 'delivery_national'
            ];
            $settingKey = $typeMap[$deliveryType] ?? null;
            if ($settingKey) {
                $isActive = \App\Models\System\SystemSetting::where('key', $settingKey)->value('value');
                if ($isActive === 'false') {
                    return response()->json(['message' => 'El método de entrega seleccionado no está disponible.'], 400);
                }
            }
        }

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

        $deliveryType = $request->input('delivery_type'); // pickup, meetup, national, delivery
        $branchId = $request->input('branch_id'); // Optional, if pickup

        try {
            DB::beginTransaction();

            // 1. Generate Reference Number
            do {
                $uniqueId = mt_rand(10000, 99999);
                $referenceNumber = 'ORD-' . $uniqueId;
            } while (\App\Models\Sales\Cart::where('reference_number', $referenceNumber)->exists());

            // Calculate Subtotal & Extract Discount Data from Session
            $subtotal = 0;
            $discountItems = [];
            foreach ($cartData['items'] as $item) {
                $isBundle = !empty($item['bundle_group_id']);
                $overridePrice = $item['override_price'] ?? ($isBundle ? $item['price'] : null);
                $priceToUse = $overridePrice !== null ? (float) $overridePrice : (float) ($item['price'] ?? 0);
                $lineSubtotal = $priceToUse * $item['quantity'];
                $subtotal += $lineSubtotal;
                
                $discountItems[] = [
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'line_subtotal' => $lineSubtotal,
                    'bundle_group_id' => $item['bundle_group_id'] ?? null,
                    'discount_label' => $item['discount_label'] ?? null
                ];
            }

            // Secure Discount Validation
            $discountId = null;
            $totalDiscount = 0;
            $proratedDiscounts = [];

            if (isset($cartData['applied_global_discount'])) {
                $discountService = app(\App\Services\Finance\DiscountValidationService::class);
                $discountResult = $discountService->validateCode(
                    $cartData['applied_global_discount']['code'],
                    $subtotal,
                    $discountItems,
                    $customer->id,
                    null
                );

                if (!$discountResult['valid']) {
                    DB::rollBack();
                    return response()->json(['message' => 'El cupón aplicado ya no es válido: ' . $discountResult['message']], 400);
                }

                $discountId = $discountResult['id'];
                $totalDiscount = $discountResult['discount_amount'];
                $proratedDiscounts = $discountService->prorateDiscountToItems($discountItems, $totalDiscount, $subtotal);
            }

            $cart = \App\Models\Sales\Cart::create([
                'customer_id' => $customer->id,
                'reference_number' => $referenceNumber,
                'source' => 'web',
                'delivery_details' => $request->input('delivery_details', null),
                'status' => 'active',
                'expires_at' => now()->addMinutes(60),
                'discount_id' => $discountId,
                'total_discount' => $totalDiscount,
            ]);

            // 2. Process Items and Verify Stock (without reserving)
            foreach ($cartData['items'] as $index => $item) {
                if (isset($item['variant_id'])) {
                    $variant = \App\Models\Catalog\ProductVariant::with(['inventories', 'product'])->find($item['variant_id']);
                    if (!$variant) {
                        return response()->json(['message' => 'Un producto del carrito ya no existe'], 400);
                    }

                    $selectedBranchId = null;

                    if ($deliveryType === 'pickup' && $branchId) {
                        $inventory = $variant->inventories->where('branch_id', $branchId)->first();
                        if (!$inventory || $inventory->stock < $item['quantity']) {
                            DB::rollBack();
                            return response()->json(['message' => 'No hay stock suficiente para ' . $variant->product->name . ' en la sucursal seleccionada'], 400);
                        }
                        $selectedBranchId = $branchId;
                    } else {
                        $inventory = $variant->inventories->sortByDesc('stock')->first();
                        if (!$inventory || $inventory->stock < $item['quantity']) {
                            DB::rollBack();
                            return response()->json(['message' => 'No hay stock suficiente para ' . $variant->product->name], 400);
                        }
                        $selectedBranchId = $inventory->branch_id;
                    }

                $isBundle = !empty($item['bundle_group_id']);
                
                $overridePrice = null;
                if ($isBundle) {
                    $overridePrice = $item['override_price'] ?? (isset($item['original_price']) && $item['price'] != $item['original_price'] ? $item['price'] : null);
                }
                
                // Insert cart item adhering to strict rules
                CartItem::create([
                    'cart_id'         => $cart->id,
                    'variant_id'      => $item['variant_id'] ?? null,
                    'quantity'        => $item['quantity'],
                    'override_price'  => $overridePrice !== null ? (float) $overridePrice : null,
                    'original_price'  => isset($item['original_price'])  ? (float) $item['original_price']  : null,
                    'bundle_group_id' => $item['bundle_group_id'] ?? null,
                    'discount_amount' => 0, // Global prorated discounts do NOT go here
                    'applied_discount_id' => $item['applied_discount_id'] ?? null,
                    'discount_label'  => $item['discount_label'] ?? null,
                ]);
                }
            }

            // Remove cart from Cache
            Cache::forget("cart:{$cartToken}");

            DB::commit();

            $waSetting = \App\Models\System\SystemSetting::where('key', 'whatsapp_orders')->first();
            $waNumber = $waSetting ? $waSetting->value : '59157003312';

            return response()->json([
                'message' => 'Checkout iniciado correctamente',
                'cart_id' => $cart->id,
                'customer_id' => $customer->id,
                'reference_number' => $cart->reference_number,
                'whatsapp_number' => $waNumber
            ]);

        } catch (\Exception $e) { \Log::error("Checkout Error: " . $e->getMessage()); \Log::error($e->getTraceAsString());
            DB::rollBack();
            return response()->json([
                'message' => 'Error al procesar el checkout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getDeliveryZones()
    {
        $zones = \App\Models\Logistics\DeliveryZone::orderBy('city')->get();
        return response()->json($zones);
    }

    public function getAvailableBranches(Request $request)
    {
        $cartToken = $request->header('X-Cart-Token');
        if (!$cartToken) {
            return response()->json(['message' => 'No cart token provided'], 400);
        }

        $cartDataJson = Cache::get("cart:{$cartToken}");
        if (!$cartDataJson) {
            return response()->json(['message' => 'El carrito estÃ¡ vacÃ­o o ha expirado'], 400);
        }

        $cartData = json_decode($cartDataJson, true);
        if (empty($cartData['items'])) {
            return response()->json(['message' => 'El carrito estÃ¡ vacÃ­o'], 400);
        }

        // Obtener IDs de las variantes
        $variantIds = collect($cartData['items'])->pluck('variant_id')->filter()->unique();

        // Si no hay variantes, devolvemos sucursales vacias
        if ($variantIds->isEmpty()) {
            return response()->json([]);
        }

        // Necesitamos las sucursales donde TODAS estas variantes tengan stock > 0
        // PodrÃ­amos hacerlo buscando sucursales que tengan inventario para cada variante.
        // Pero el requerimiento dice: "donde se encuentren los productos seleccionados, (no repitas sucursal)"
        // Vamos a buscar todas las sucursales que tengan stock > 0 de CUALQUIER variante en el carrito, o TODAS? 
        // Si el cliente pide 3 productos, la sucursal deberÃ­a tener los 3? Lo ideal es que tenga los 3.
        // Contamos cuÃ¡ntas variantes de las que estÃ¡n en el carrito tienen stock > 0 en cada sucursal.
        $totalVariants = $variantIds->count();

        $branches = \App\Models\Branch\Branch::with(['images', 'address'])
            ->whereHas('inventories', function($query) use ($variantIds) {
                $query->whereIn('variant_id', $variantIds)
                      ->where('stock', '>', 0);
            }, '>=', $totalVariants)->get();

        // format output
        $formattedBranches = $branches->map(function($branch) {
            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'phone' => $branch->phone,
                'address' => $branch->address ? ($branch->address->street . ' ' . $branch->address->reference) : null,
                'image' => $branch->images->first() ? $branch->images->first()->image_url : null
            ];
        });

        return response()->json($formattedBranches);
    }
}



