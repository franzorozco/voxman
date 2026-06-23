<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\Actors\Customer;
use App\Models\Catalog\ProductVariant;
use App\Models\Finance\CashMovement;
use App\Models\Finance\CashRegister;
use App\Models\Finance\Payment;
use App\Models\Inventory\Inventory;
use App\Models\Inventory\InventoryMovement;
use App\Models\Sales\Sale;
use App\Models\Sales\SaleDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PosSaleController extends Controller
{
    /**
     * Process POS checkout (create sale, deduct stock, register payment)
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'branch_id' => 'required|uuid|exists:branches,id',
            'payment_method_id' => 'required|uuid|exists:payment_methods,id',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|uuid|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
            'discount_total' => 'nullable|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'amount_paid' => 'required|numeric|min:0', // El cliente podría dar más (vuelto)
        ]);

        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Solo los empleados pueden registrar ventas en POS.'], 403);
        }

        // Verify cash register is open
        $cashRegister = CashRegister::where('employee_id', $employee->id)
            ->where('status', 'open')
            ->first();

        if (!$cashRegister) {
            return response()->json(['message' => 'Debes tener una caja abierta para procesar ventas.'], 400);
        }

        // Ensure amount paid is at least the total
        if ($request->amount_paid < $request->total) {
            return response()->json(['message' => 'El monto pagado no puede ser menor al total de la venta.'], 400);
        }

        try {
            DB::beginTransaction();

            // 1. Create Sale
            $sale = new Sale();
            $sale->branch_id = $request->branch_id;
            $sale->customer_id = $request->customer_id; // can be null for generic customer
            $sale->employee_id = $employee->id;
            $sale->sale_type = 'store';
            $sale->status = 'paid';
            $sale->source = 'store';
            $sale->subtotal = $request->subtotal;
            $sale->discount_total = $request->discount_total ?? 0;
            $sale->total = $request->total;
            // Generate simple invoice number
            $sale->invoice_number = 'POS-' . time() . '-' . rand(1000, 9999);
            $sale->save();

            // 2. Process Items
            foreach ($request->items as $item) {
                $variant = ProductVariant::findOrFail($item['variant_id']);
                
                // Deduct stock
                $inventory = Inventory::where('branch_id', $request->branch_id)
                    ->where('variant_id', $variant->id)
                    ->lockForUpdate() // Avoid race conditions
                    ->first();

                if (!$inventory || $inventory->stock < $item['quantity']) {
                    throw new \Exception("Stock insuficiente para el producto: " . ($variant->sku ?? 'Desconocido'));
                }

                $stockBefore = $inventory->stock;
                $inventory->stock -= $item['quantity'];
                $inventory->save();

                // Create Inventory Movement
                $movement = new InventoryMovement();
                $movement->variant_id = $variant->id;
                $movement->branch_id = $request->branch_id;
                $movement->movement_type = 'sale';
                $movement->quantity = -$item['quantity'];
                $movement->stock_before = $stockBefore;
                $movement->stock_after = $inventory->stock;
                $movement->reference_type = 'sale';
                $movement->reference_id = $sale->id;
                $movement->created_by = $user->id;
                $movement->save();

                // Create Sale Detail
                $detailDiscount = $item['discount'] ?? 0;
                $finalPrice = $item['unit_price'] - $detailDiscount;
                
                $saleDetail = new SaleDetail();
                $saleDetail->sale_id = $sale->id;
                $saleDetail->variant_id = $variant->id;
                $saleDetail->owner_id = $variant->product->owner_id ?? null;
                $saleDetail->quantity = $item['quantity'];
                $saleDetail->unit_price = $item['unit_price'];
                $saleDetail->discount = $detailDiscount;
                $saleDetail->final_price = $finalPrice;
                $saleDetail->subtotal = $finalPrice * $item['quantity'];
                $saleDetail->save();
            }

            // 3. Create Payment
            $payment = new Payment();
            $payment->sale_id = $sale->id;
            $payment->cash_register_id = $cashRegister->id;
            $payment->payment_method_id = $request->payment_method_id;
            $payment->amount = $request->total; // we record the total sale, not amount paid (to handle change)
            $payment->status = 'completed';
            $payment->save();

            // 4. Register Cash Movement
            $cashMovement = new CashMovement();
            $cashMovement->cash_register_id = $cashRegister->id;
            $cashMovement->movement_type = 'income';
            $cashMovement->amount = $request->total;
            $cashMovement->reference_type = 'sale';
            $cashMovement->reference_id = $sale->id;
            $cashMovement->description = 'Venta POS ' . $sale->invoice_number;
            $cashMovement->save();

            DB::commit();

            return response()->json([
                'message' => 'Venta procesada con éxito.',
                'sale' => $sale,
                'change' => $request->amount_paid - $request->total // Cambio para el cajero
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al procesar la venta.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
