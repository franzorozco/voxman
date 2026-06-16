<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Purchase\Purchase;
use App\Models\Purchase\PurchaseDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Purchase::with(['supplier', 'branch', 'employee.user.user_profiles', 'purchase_details.product_variant.product']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'ILIKE', "%{$search}%")
                  ->orWhereHas('supplier', function($sq) use ($search) {
                      $sq->where('name', 'ILIKE', "%{$search}%");
                  });
            });
        }

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $purchases = $query->orderBy('created_at', 'desc')->paginate(15);
        return response()->json($purchases);
    }

    public function show($id)
    {
        $purchase = Purchase::with(['supplier', 'branch', 'employee.user.user_profiles', 'purchase_details.product_variant.product.product_images'])->findOrFail($id);
        return response()->json($purchase);
    }

    public function store(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|uuid|exists:suppliers,id',
            'branch_id' => 'required|uuid|exists:branches,id',
            'employee_id' => 'required|uuid|exists:employees,id',
            'invoice_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|uuid|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $subtotal = 0;
            foreach ($request->items as $item) {
                $subtotal += ($item['quantity'] * $item['unit_cost']);
            }
            
            // Calculamos tax si lo hubiera, por ahora lo dejaremos en 0 o lo que envíe el request si tuvieran
            $tax = $request->input('tax', 0);
            $total = $subtotal + $tax;

            $purchase = Purchase::create([
                'id' => Str::uuid(),
                'supplier_id' => $request->supplier_id,
                'branch_id' => $request->branch_id,
                'employee_id' => $request->employee_id,
                'status' => 'pending', // Fase 2: Siempre se crea como pending
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'invoice_number' => $request->invoice_number,
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_cost'];
                PurchaseDetail::create([
                    'id' => Str::uuid(),
                    'purchase_id' => $purchase->id,
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'subtotal' => $itemSubtotal,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Orden de compra creada exitosamente en estado pendiente.',
                'purchase_id' => $purchase->id
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Ocurrió un error al crear la orden de compra.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function cancel($id)
    {
        try {
            DB::beginTransaction();
            $purchase = Purchase::findOrFail($id);

            if ($purchase->status !== 'pending') {
                return response()->json(['message' => 'Solo se pueden cancelar órdenes en estado pendiente.'], 400);
            }

            $purchase->status = 'cancelled';
            $purchase->save();

            DB::commit();
            return response()->json(['message' => 'Orden de compra cancelada exitosamente.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al cancelar la orden.'], 500);
        }
    }
}
