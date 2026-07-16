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
        $convertedCarts = $allCarts->where('status', 'converted');
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
            'discount_id' => 'nullable|uuid|exists:discounts,id'
        ]);

        if ($request->filled('discount_id')) {
            abort_unless(auth()->user()->can('apply_cart_discounts'), 403, 'No tienes permiso para aplicar descuentos.');
        }

        $cart = new Cart();
        $cart->customer_id = $request->customer_id;
        $cart->reference_number = 'PROF-' . strtoupper(Str::random(6));
        $cart->status = 'proforma';
        $cart->source = 'store';
        $cart->discount_id = $request->discount_id;
        $cart->save();

        $subtotal = 0;
        $cartItemsData = [];

        foreach ($request->items as $itemData) {
            $variant = \App\Models\Catalog\ProductVariant::find($itemData['variant_id']);
            if (!$variant) continue;
            $lineSubtotal = $variant->price * $itemData['quantity'];
            $subtotal += $lineSubtotal;
            $cartItemsData[] = [
                'variant_id' => $variant->id,
                'quantity' => $itemData['quantity'],
                'line_subtotal' => $lineSubtotal
            ];
        }

        $totalDiscount = 0;
        if ($cart->discount_id && $subtotal > 0) {
            $discount = \App\Models\Discount\Discount::find($cart->discount_id);
            if ($discount) {
                if ($discount->type === 'percentage') {
                    $totalDiscount = $subtotal * ($discount->value / 100);
                } else {
                    $totalDiscount = $discount->value;
                }
                if ($discount->max_discount_amount) {
                    $totalDiscount = min($totalDiscount, $discount->max_discount_amount);
                }
                $totalDiscount = min($totalDiscount, $subtotal); // Cannot discount more than subtotal
            }
        }

        $cart->total_discount = $totalDiscount;
        $cart->save();

        $remainingDiscount = $totalDiscount;
        $totalItems = count($cartItemsData);

        foreach ($cartItemsData as $index => $itemData) {
            $cartItem = new \App\Models\Sales\CartItem();
            $cartItem->cart_id = $cart->id;
            $cartItem->variant_id = $itemData['variant_id'];
            $cartItem->quantity = $itemData['quantity'];
            
            if ($totalDiscount > 0) {
                if ($index === $totalItems - 1) {
                    // Last item takes whatever is left of the discount to avoid rounding cent issues
                    $itemDiscount = $remainingDiscount;
                } else {
                    $weight = $itemData['line_subtotal'] / $subtotal;
                    $itemDiscount = round($totalDiscount * $weight, 2);
                    $remainingDiscount -= $itemDiscount;
                }
                $cartItem->discount_amount = max(0, $itemDiscount);
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
            'discount_id' => 'nullable|uuid|exists:discounts,id'
        ]);

        if ($request->filled('discount_id')) {
            abort_unless(auth()->user()->can('apply_cart_discounts'), 403, 'No tienes permiso para aplicar descuentos.');
        }

        $cart = Cart::findOrFail($id);
        
        if ($cart->status === 'converted') {
            return response()->json(['message' => 'No se puede editar un carrito ya convertido a venta.'], 400);
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
            $lineSubtotal = $variant->price * $itemData['quantity'];
            $subtotal += $lineSubtotal;
            $cartItemsData[] = [
                'variant_id' => $variant->id,
                'quantity' => $itemData['quantity'],
                'line_subtotal' => $lineSubtotal
            ];
        }

        $totalDiscount = 0;
        if ($cart->discount_id && $subtotal > 0) {
            $discount = \App\Models\Discount\Discount::find($cart->discount_id);
            if ($discount) {
                if ($discount->type === 'percentage') {
                    $totalDiscount = $subtotal * ($discount->value / 100);
                } else {
                    $totalDiscount = $discount->value;
                }
                if ($discount->max_discount_amount) {
                    $totalDiscount = min($totalDiscount, $discount->max_discount_amount);
                }
                $totalDiscount = min($totalDiscount, $subtotal); // Cannot discount more than subtotal
            }
        }

        $cart->total_discount = $totalDiscount;
        $cart->save();

        $remainingDiscount = $totalDiscount;
        $totalItems = count($cartItemsData);

        foreach ($cartItemsData as $index => $itemData) {
            $cartItem = new \App\Models\Sales\CartItem();
            $cartItem->cart_id = $cart->id;
            $cartItem->variant_id = $itemData['variant_id'];
            $cartItem->quantity = $itemData['quantity'];
            
            if ($totalDiscount > 0) {
                if ($index === $totalItems - 1) {
                    $itemDiscount = $remainingDiscount;
                } else {
                    $weight = $itemData['line_subtotal'] / $subtotal;
                    $itemDiscount = round($totalDiscount * $weight, 2);
                    $remainingDiscount -= $itemDiscount;
                }
                $cartItem->discount_amount = max(0, $itemDiscount);
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
        $cart = Cart::findOrFail($id);
        $cart->status = 'converted';
        $cart->save();

        return response()->json([
            'message' => 'Carrito convertido a venta.',
            'cart' => $cart
        ]);
    }

    public function sendReminder($id)
    {
        $cart = Cart::findOrFail($id);
        
        return response()->json([
            'message' => 'Recordatorio enviado exitosamente al cliente.'
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
