<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sales\Cart;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $query = Cart::with(['user.profile', 'items.product_variant.product'])
            ->orderBy('created_at', 'desc');

        if (auth()->check() && !auth()->user()->can('view_carts_all_branches')) {
            $branchId = auth()->user()->branch_id;
            $query->whereHas('user', function($q) use ($branchId) {
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
            $query->where('reference_number', 'ilike', '%' . $request->search . '%');
        }

        $allCarts = Cart::with(['items.product_variant'])->get();
        
        $abandonedCarts = $allCarts->where('status', 'abandoned');
        $abandonedValue = $abandonedCarts->sum('total_amount');
        
        $activeProformasCount = $allCarts->where('status', 'proforma')->count();
        
        $totalCarts = $allCarts->count();
        $convertedCarts = $allCarts->where('status', 'converted')->count();
        $conversionRate = $totalCarts > 0 ? round(($convertedCarts / $totalCarts) * 100, 2) : 0;

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
                'conversion_rate' => $conversionRate
            ]
        ]);
    }

    public function show($id)
    {
        $cart = Cart::with([
            'user.profile', 
            'items.product_variant.product.images',
            'items.product_variant.size',
            'items.product_variant.fit'
        ])->findOrFail($id);
        
        if (auth()->check() && !auth()->user()->can('view_carts_all_branches')) {
            if ($cart->user && $cart->user->branch_id !== auth()->user()->branch_id) {
                abort(403, 'No tienes permiso para ver carritos de otras sucursales.');
            }
        }
        
        $cart->total_amount_calculated = $cart->total_amount;
        
        return response()->json($cart);
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
