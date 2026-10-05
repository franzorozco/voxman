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
        $query = Purchase::with(['supplier', 'branch', 'employee.user.user_profiles', 'purchase_details.product_variant.product.product_images',
            'purchase_details.product_variant.product.attribute_value_images',
            'purchase_details.product_variant.variant_images',
            'purchase_details.product_variant.variant_attribute_values', 
          'purchase_details.product_variant.product.attribute_value_images', 
          'purchase_details.product_variant.variant_images',
          'purchase_details.product_variant.variant_attribute_values',
          'accounts_payables']);

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
        $purchase = Purchase::with([
            'supplier', 
            'branch', 
            'employee.user.user_profiles', 
            'purchase_details.product_variant.product.product_images',
            'purchase_details.product_variant.product.attribute_value_images',
            'purchase_details.product_variant.variant_images',
            'purchase_details.product_variant.variant_attribute_values',
            'accounts_payables',
            'supplier_payments.paymentMethod'
        ])->findOrFail($id);
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

    public function stats()
    {
        // Deuda Total Pendiente (suma de balances en accounts_payable)
        $totalDebt = \App\Models\Finance\AccountsPayable::sum('balance');

        // Total Comprado este mes (estado received)
        $monthlyPurchases = Purchase::whereMonth('created_at', now()->month)
                                    ->whereYear('created_at', now()->year)
                                    ->where('status', 'received')
                                    ->sum('total');

        // Total Pagado este mes a proveedores
        $monthlyPayments = \App\Models\Finance\SupplierPayment::whereMonth('created_at', now()->month)
                                    ->whereYear('created_at', now()->year)
                                    ->where('status', 'completed')
                                    ->sum('amount');

        return response()->json([
            'total_debt' => $totalDebt,
            'monthly_purchases' => $monthlyPurchases,
            'monthly_payments' => $monthlyPayments,
        ]);
    }

    public function updateCosts(Request $request, $id)
    {
        $request->validate([
            'shipping_cost' => 'required|numeric|min:0',
            'other_costs' => 'nullable|numeric|min:0'
        ]);

        try {
            DB::beginTransaction();

            $purchase = Purchase::findOrFail($id);
            
            if ($purchase->status !== 'pending') {
                return response()->json(['message' => 'Solo se pueden actualizar costos de importación en órdenes pendientes antes de su recepción.'], 400);
            }

            $shipping = $request->input('shipping_cost', 0);
            $other = $request->input('other_costs', 0);

            // Sum to total
            // Since there is no shipping_cost column in purchases table as per DB schema,
            // we have to just add it to the total, or store it in 'notes'.
            // Wait, we can't easily store shipping_cost if the column doesn't exist.
            // Let's store it in a JSON column? No, we don't have one.
            // Let's just adjust the 'total' and append to 'notes' for now to avoid migration.
            
            $purchase->total = $purchase->subtotal + $purchase->tax + $shipping + $other;
            $purchase->notes = $purchase->notes . "\n[Landed Cost] Flete/Otros: Bs. " . ($shipping + $other);
            $purchase->save();

            DB::commit();
            return response()->json([
                'message' => 'Costos adicionales agregados exitosamente',
                'purchase' => $purchase
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al actualizar costos',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
