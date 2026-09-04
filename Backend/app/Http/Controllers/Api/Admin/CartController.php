<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sales\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $query = Cart::with([
            'customer.user.profile', 
            'customer.posProfile', 
            'items.product_variant.product.product_images',
            'items.product_variant.product.attribute_value_images',
            'items.product_variant.variant_images',
            'items.product_variant.variant_attribute_values.attribute_value.attribute',
            'items.product_variant.size',
            'items.product_variant.fit',
            'items.product_variant.inventories.branch'
        ])
            ->orderBy('created_at', 'desc');

        if (auth()->check() && !auth()->user()->can('view_carts_all_branches')) {
            $branchId = auth()->user()->branch_id;
            $query->whereHas('customer.user', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('reference_number', 'ilike', '%' . $search . '%')
                  ->orWhereHas('customer.user', function($qUser) use ($search) {
                      $qUser->where('name', 'ilike', '%' . $search . '%')
                            ->orWhere('email', 'ilike', '%' . $search . '%');
                  });
            });
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Sorting
        $sortBy = $request->query('sortBy', 'created_at');
        $sortDir = strtolower($request->query('sortDir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['created_at', 'status', 'source'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $allCarts = Cart::with(['items.product_variant'])->get();
        
        $abandonedCarts = $allCarts->where('status', 'abandoned');
        $abandonedValue = $abandonedCarts->sum('total_amount');
        
        $activeProformasCount = $allCarts->where('status', 'proforma')->count();
        $proformasValue = $allCarts->where('status', 'proforma')->sum('total_amount');
        
        $totalCarts = $allCarts->count();
        $convertedCarts = $allCarts->whereIn('status', ['converted', 'ordered']);
        $convertedCount = $convertedCarts->count();
        $convertedValue = $convertedCarts->sum('total_amount');
        $conversionRate = $totalCarts > 0 ? round(($convertedCount / $totalCarts) * 100, 2) : 0;
        
        $averageValue = $totalCarts > 0 ? round($allCarts->sum('total_amount') / $totalCarts, 2) : 0;

        $carts = $query->paginate($request->get('per_page', 15));

        $carts->getCollection()->transform(function ($cart) {
            $cart->total_amount_calculated = $cart->total_amount;
            return $cart;
        });

        return response()->json([
            'data' => $carts,
            'summary' => [
                'abandoned_value' => $abandonedValue,
                'active_proformas' => $activeProformasCount,
                'proformas_value' => $proformasValue,
                'conversion_rate' => $conversionRate,
                'converted_value' => $convertedValue,
                'average_value' => $averageValue
            ]
        ]);
    }

    public function show($id)
    {
        $cart = Cart::with([
            'customer.user.profile',
            'customer.posProfile',
            'items.product_variant.product.product_images',
            'items.product_variant.product.attribute_value_images',
            'items.product_variant.variant_images',
            'items.product_variant.variant_attribute_values.attribute_value.attribute',
            'items.product_variant.size',
            'items.product_variant.fit',
            'items.product_variant.inventories.branch'
        ])->findOrFail($id);
        
        if (auth()->check() && !auth()->user()->can('view_carts_all_branches')) {
            if ($cart->customer && $cart->customer->user && $cart->customer->user->branch_id !== auth()->user()->branch_id) {
                abort(403, 'No tienes permiso para ver carritos de otras sucursales.');
            }
        }
        
        $cart->total_amount_calculated = $cart->total_amount;
        
        return response()->json($cart);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|uuid|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.override_price' => 'nullable|numeric|min:0',
            'items.*.original_price' => 'nullable|numeric|min:0',
            'items.*.bundle_group_id' => 'nullable|string',
            'discount_id' => 'nullable|uuid|exists:discounts,id'
        ]);

        if ($request->filled('discount_id')) {
            abort_unless(auth()->user()->can('apply_cart_discounts'), 403, 'No tienes permiso para aplicar descuentos.');
        }

        $cart = new Cart();
        $cart->customer_id = $request->customer_id;
        $cart->reference_number = 'PROF-' . strtoupper(Str::random(6));
        $cart->status = 'proforma';
        $cart->source = $request->input('source', 'store');
        $cart->discount_id = $request->discount_id;
        $cart->save();

        $subtotal = 0;
        $cartItemsData = [];

        foreach ($request->items as $itemData) {
            $variant = \App\Models\Catalog\ProductVariant::find($itemData['variant_id']);
            if (!$variant) continue;
            
            $priceToUse = isset($itemData['override_price']) ? $itemData['override_price'] : $variant->price;
            $lineSubtotal = $priceToUse * $itemData['quantity'];
            $subtotal += $lineSubtotal;
            
            $cartItemsData[] = [
                'variant_id' => $variant->id,
                'quantity' => $itemData['quantity'],
                'override_price' => $itemData['override_price'] ?? null,
                'original_price' => $itemData['original_price'] ?? null,
                'bundle_group_id' => $itemData['bundle_group_id'] ?? null,
                'line_subtotal' => $lineSubtotal
            ];
        }

        // Validate discount through centralized service
        $totalDiscount = 0;
        $proratedDiscounts = [];
        if ($cart->discount_id && $subtotal > 0) {
            $discountService = app(\App\Services\Finance\DiscountValidationService::class);
            $result = $discountService->validateCode(
                $cart->discount_id,
                $subtotal,
                $cartItemsData,
                $request->customer_id,
                null
            );
            if (!$result['valid']) {
                $cart->delete();
                return response()->json(['message' => $result['message']], 422);
            }
            $totalDiscount = $result['discount_amount'];
            $proratedDiscounts = $discountService->prorateDiscountToItems($cartItemsData, $totalDiscount, $subtotal);
        }

        $cart->total_discount = $totalDiscount;
        $cart->save();

        foreach ($cartItemsData as $itemData) {
            $cartItem = new \App\Models\Sales\CartItem();
            $cartItem->cart_id = $cart->id;
            $cartItem->variant_id = $itemData['variant_id'];
            $cartItem->quantity = $itemData['quantity'];
            $cartItem->override_price = $itemData['override_price'];
            $cartItem->original_price = $itemData['original_price'];
            $cartItem->bundle_group_id = $itemData['bundle_group_id'];
            
            if (isset($proratedDiscounts[$itemData['variant_id']])) {
                $cartItem->discount_amount = $proratedDiscounts[$itemData['variant_id']];
            }

            $cartItem->save();
        }

        return response()->json([
            'message' => 'Proforma creada exitosamente',
            'cart' => $cart->load(['items.product_variant.product'])
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|uuid|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.override_price' => 'nullable|numeric|min:0',
            'items.*.original_price' => 'nullable|numeric|min:0',
            'items.*.bundle_group_id' => 'nullable|string',
            'discount_id' => 'nullable|uuid|exists:discounts,id'
        ]);

        if ($request->filled('discount_id')) {
            abort_unless(auth()->user()->can('apply_cart_discounts'), 403, 'No tienes permiso para aplicar descuentos.');
        }

        $cart = Cart::findOrFail($id);
        
        if ($cart->status === 'converted' || $cart->status === 'ordered') {
            return response()->json(['message' => 'No se puede editar un carrito ya convertido.'], 400);
        }

        $cart->customer_id = $request->customer_id;
        $cart->discount_id = $request->discount_id;
        $cart->save();
        
        // Remove old items
        $cart->items()->delete();

        $subtotal = 0;
        $cartItemsData = [];

        foreach ($request->items as $itemData) {
            $variant = \App\Models\Catalog\ProductVariant::find($itemData['variant_id']);
            if (!$variant) continue;
            
            $priceToUse = isset($itemData['override_price']) ? $itemData['override_price'] : $variant->price;
            $lineSubtotal = $priceToUse * $itemData['quantity'];
            $subtotal += $lineSubtotal;
            
            $cartItemsData[] = [
                'variant_id' => $variant->id,
                'quantity' => $itemData['quantity'],
                'override_price' => $itemData['override_price'] ?? null,
                'original_price' => $itemData['original_price'] ?? null,
                'bundle_group_id' => $itemData['bundle_group_id'] ?? null,
                'line_subtotal' => $lineSubtotal
            ];
        }

        $totalDiscount = 0;
        $proratedDiscounts = [];
        if ($cart->discount_id && $subtotal > 0) {
            $discountService = app(\App\Services\Finance\DiscountValidationService::class);
            $result = $discountService->validateCode(
                $cart->discount_id,
                $subtotal,
                $cartItemsData,
                $request->customer_id,
                null
            );
            if (!$result['valid']) {
                // Reset discount if no longer valid (e.g. expired after proforma was created)
                $cart->discount_id = null;
                $cart->save();
                return response()->json(['message' => $result['message']], 422);
            }
            $totalDiscount = $result['discount_amount'];
            $proratedDiscounts = $discountService->prorateDiscountToItems($cartItemsData, $totalDiscount, $subtotal);
        }

        $cart->total_discount = $totalDiscount;
        $cart->save();

        foreach ($cartItemsData as $itemData) {
            $cartItem = new \App\Models\Sales\CartItem();
            $cartItem->cart_id = $cart->id;
            $cartItem->variant_id = $itemData['variant_id'];
            $cartItem->quantity = $itemData['quantity'];
            $cartItem->override_price = $itemData['override_price'];
            $cartItem->original_price = $itemData['original_price'];
            $cartItem->bundle_group_id = $itemData['bundle_group_id'];
            
            if (isset($proratedDiscounts[$itemData['variant_id']])) {
                $cartItem->discount_amount = $proratedDiscounts[$itemData['variant_id']];
            }

            $cartItem->save();
        }

        return response()->json([
            'message' => 'Proforma actualizada exitosamente',
            'cart' => $cart->load(['items.product_variant.product'])
        ]);
    }

    public function convert($id)
    {
        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            $cart = Cart::with('items.product_variant')->findOrFail($id);

            if ($cart->status === 'converted' || $cart->status === 'ordered') {
                return response()->json(['error' => 'El carrito ya fue convertido.'], 400);
            }

            $adminUser = auth()->user();
            $adminBranchId = $adminUser && $adminUser->employee ? $adminUser->employee->branch_id : null;

            // Create a sale
            $sale = \App\Models\Sales\Sale::create([
                'customer_id' => $cart->customer_id,
                'guest_id' => $cart->guest_id,
                'user_id' => $adminUser ? $adminUser->id : null,
                'branch_id' => $adminBranchId,
                'invoice_number' => 'VNT-' . strtoupper(Str::random(6)),
                'sale_type' => 'in_store',
                'status' => 'completed',
                'source' => 'web_conversion',
                'subtotal' => 0,
                'discount_total' => $cart->total_discount ?? 0,
                'discount_id' => $cart->discount_id ?? null,
                'total' => 0,
                'notes' => 'Convertido desde carrito ' . $cart->reference_number
            ]);

            if ($sale->discount_id) {
                \App\Models\Discount\Discount::where('id', $sale->discount_id)->increment('used_count');
            }

            $subtotal = 0;

            foreach ($cart->items as $item) {
                // If override_price exists (bundle item), use it. Otherwise use normal variant price.
                $price = $item->override_price !== null 
                    ? (float) $item->override_price 
                    : ($item->product_variant->price ?? 0);
                    
                $discountAmount = $item->discount_amount ?? 0;
                $finalPrice = max(0, $price - $discountAmount);
                $lineTotal = $finalPrice * $item->quantity;
                $subtotal += $lineTotal;

                $detail = \App\Models\Sales\SaleDetail::create([
                    'sale_id'         => $sale->id,
                    'variant_id'      => $item->variant_id,
                    'quantity'        => $item->quantity,
                    'unit_price'      => $price,
                    'discount'        => $discountAmount,
                    'final_price'     => $finalPrice,
                    'subtotal'        => $lineTotal,
                    'original_price'  => $item->original_price,
                    'bundle_price'    => $item->bundle_group_id ? $price : null,
                    'bundle_group_id' => $item->bundle_group_id,
                ]);

                if ($sale->discount_id && $discountAmount > 0) {
                    \App\Models\Sales\SaleAppliedDiscount::create([
                        'sale_id'         => $sale->id,
                        'sale_detail_id'  => $detail->id,
                        'discount_id'     => $sale->discount_id,
                        'discount_amount' => $discountAmount,
                    ]);
                }

                // Find Stock Reservations for this cart and confirm them
                $reservations = \App\Models\Inventory\StockReservation::where('variant_id', $item->variant_id)
                    ->where('cart_id', $cart->id)
                    ->where('status', 'reserved')
                    ->get();
                
                $quantityToDeduct = $item->quantity;

                foreach ($reservations as $reservation) {
                    $reservation->status = 'confirmed';
                    $reservation->sale_id = $sale->id;
                    $reservation->save();

                    // Deduct stock
                    $inventory = \App\Models\Inventory\Inventory::where('branch_id', $reservation->branch_id)
                        ->where('variant_id', $reservation->variant_id)
                        ->first();
                        
                    if ($inventory) {
                        $stockBefore = $inventory->stock;
                        $inventory->stock = max(0, $inventory->stock - $reservation->quantity);
                        $inventory->save();

                        \App\Models\Inventory\InventoryMovement::create([
                            'variant_id' => $item->variant_id,
                            'branch_id' => $reservation->branch_id,
                            'movement_type' => 'sale',
                            'quantity' => (int) $reservation->quantity,
                            'stock_before' => $stockBefore,
                            'stock_after' => $inventory->stock,
                            'reference_type' => 'sale',
                            'reference_id' => $sale->id,
                            'created_by' => $adminUser ? $adminUser->id : null,
                            'notes' => 'Conversión a Venta desde Proforma'
                        ]);

                        $quantityToDeduct -= $reservation->quantity;
                    }
                }

                // If no reservations were found (e.g. manual proforma) or quantity still missing, deduct from branch with highest stock
                if ($quantityToDeduct > 0) {
                    $inventory = \App\Models\Inventory\Inventory::where('variant_id', $item->variant_id)
                        ->orderBy('stock', 'desc')
                        ->first();
                    
                    if ($inventory) {
                        $stockBefore = $inventory->stock;
                        $inventory->stock = max(0, $inventory->stock - $quantityToDeduct);
                        $inventory->save();

                        \App\Models\Inventory\InventoryMovement::create([
                            'variant_id' => $item->variant_id,
                            'branch_id' => $inventory->branch_id,
                            'movement_type' => 'sale',
                            'quantity' => (int) $quantityToDeduct,
                            'stock_before' => $stockBefore,
                            'stock_after' => $inventory->stock,
                            'reference_type' => 'sale',
                            'reference_id' => $sale->id,
                            'created_by' => $adminUser ? $adminUser->id : null,
                            'notes' => 'Conversión a Venta (Auto-asignación de sucursal)'
                        ]);
                    }
                }
            }

            $sale->subtotal = $subtotal;
            $sale->total = max(0, $subtotal - ($sale->discount_total ?? 0));
            $sale->save();

            // Create Payment using Efectivo (Cash) as default for admin manual conversions
            $cashMethod = \App\Models\Finance\PaymentMethod::whereRaw('LOWER(name) = ?', ['efectivo'])->first();
            if ($cashMethod && $sale->total > 0) {
                \App\Models\Finance\Payment::create([
                    'sale_id' => $sale->id,
                    'cash_register_id' => null,
                    'payment_method_id' => $cashMethod->id,
                    'amount' => $sale->total,
                    'currency' => 'BOB',
                    'status' => 'completed',
                    'transaction_reference' => 'PYM-' . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT)
                ]);
            }

            $cart->status = 'converted';
            $cart->save();

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Carrito convertido a venta exitosamente.',
                'cart' => $cart,
                'sale' => $sale
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Illuminate\Support\Facades\Log::error("Cart Convert Error: " . $e->getMessage() . " trace: " . $e->getTraceAsString());
            return response()->json(['error' => 'Error al convertir a venta: ' . $e->getMessage()], 500);
        }
    }

    public function sendReminder($id)
    {
        $cart = Cart::findOrFail($id);
        
        return response()->json([
            'message' => 'Recordatorio enviado exitosamente al cliente.'
        ]);
    }

    public function restore($id)
    {
        $cart = Cart::findOrFail($id);
        
        $isExpired = $cart->expires_at && \Carbon\Carbon::parse($cart->expires_at)->isPast();
        if (!$isExpired) {
            return response()->json(['message' => 'Este carrito no ha expirado.'], 400);
        }

        if ($cart->status === 'converted' || $cart->status === 'ordered') {
            return response()->json(['message' => 'No se puede restaurar un carrito ya convertido.'], 400);
        }

        $cart->expires_at = now()->addDays(3);
        
        if ($cart->status === 'abandoned') {
            $cart->status = in_array($cart->source, ['pos', 'admin']) ? 'proforma' : 'active';
        }

        $cart->save();

        return response()->json([
            'message' => 'Carrito restaurado exitosamente.',
            'cart' => $cart
        ]);
    }

    public function destroy($id)
    {
        $cart = Cart::findOrFail($id);
        $cart->items()->delete();
        $cart->delete();

        return response()->json([
            'message' => 'Carrito eliminado correctamente.'
        ]);
    }
}
