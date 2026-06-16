<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Purchase\Purchase;
use App\Models\Purchase\PurchaseReception;
use App\Models\Purchase\PurchaseReceptionDetail;
use App\Models\Inventory\Inventory;
use App\Models\Inventory\InventoryMovement;

class PurchaseReceptionController extends Controller
{
    /**
     * Store a new purchase reception.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'purchase_id' => 'required|uuid|exists:purchases,id',
            'employee_id' => 'required|uuid|exists:employees,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|uuid|exists:product_variants,id',
            'items.*.expected_quantity' => 'required|integer|min:0',
            'items.*.received_quantity' => 'required|integer|min:0',
            'items.*.damaged_quantity' => 'required|integer|min:0',
            'items.*.wrong_quantity' => 'required|integer|min:0',
            'items.*.extra_quantity' => 'required|integer|min:0',
            'items.*.accepted_quantity' => 'required|integer|min:0',
        ]);

        try {
            DB::beginTransaction();

            $purchase = Purchase::findOrFail($request->purchase_id);

            // Create the reception record
            $reception = PurchaseReception::create([
                'id' => Str::uuid(),
                'purchase_id' => $purchase->id,
                'employee_id' => $request->employee_id,
                'status' => 'completed',
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                // 1. Create the detail record
                PurchaseReceptionDetail::create([
                    'reception_id' => $reception->id,
                    'variant_id' => $item['variant_id'],
                    'expected_quantity' => $item['expected_quantity'],
                    'received_quantity' => $item['received_quantity'],
                    'damaged_quantity' => $item['damaged_quantity'],
                    'wrong_quantity' => $item['wrong_quantity'],
                    'extra_quantity' => $item['extra_quantity'],
                    'accepted_quantity' => $item['accepted_quantity'],
                    'created_at' => now()
                ]);

                // 2. Add ACCEPTED quantity to the Branch Inventory
                if ($item['accepted_quantity'] > 0) {
                    $inventory = Inventory::where('branch_id', $purchase->branch_id)
                                          ->where('variant_id', $item['variant_id'])
                                          ->first();
                    
                    $stockBefore = 0;
                    if ($inventory) {
                        $stockBefore = $inventory->stock;
                        $inventory->stock += $item['accepted_quantity'];
                        $inventory->save();
                    } else {
                        // Create inventory record if it doesn't exist
                        $inventory = Inventory::create([
                            'branch_id' => $purchase->branch_id,
                            'variant_id' => $item['variant_id'],
                            'stock' => $item['accepted_quantity'],
                            'min_stock' => 0
                        ]);
                    }

                    $stockAfter = $inventory->stock;

                    InventoryMovement::create([
                        'variant_id' => $item['variant_id'],
                        'branch_id' => $purchase->branch_id,
                        'created_by' => auth()->id() ?? \App\Models\Core\User::first()->id, // Fallback si no hay auth
                        'movement_type' => 'purchase',
                        'quantity' => $item['accepted_quantity'],
                        'reference' => 'Recepción de OC #' . ($purchase->invoice_number ?? $purchase->id),
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'reference_type' => 'purchase_reception',
                        'reference_id' => $reception->id,
                        'notes' => 'Ingreso por abastecimiento. ' . ($item['damaged_quantity'] > 0 ? "Hubo merma." : "")
                    ]);
                }

                // Añadir lógica para Merma/Cuarentena
                if ($item['damaged_quantity'] > 0) {
                    \App\Models\Inventory\QuarantineItem::create([
                        'purchase_reception_id' => $reception->id,
                        'variant_id' => $item['variant_id'],
                        'branch_id' => $purchase->branch_id,
                        'reason' => 'damaged',
                        'quantity' => $item['damaged_quantity'],
                        'status' => 'pending'
                    ]);
                }

                if ($item['wrong_quantity'] > 0) {
                    \App\Models\Inventory\QuarantineItem::create([
                        'purchase_reception_id' => $reception->id,
                        'variant_id' => $item['variant_id'],
                        'branch_id' => $purchase->branch_id,
                        'reason' => 'wrong',
                        'quantity' => $item['wrong_quantity'],
                        'status' => 'pending'
                    ]);
                }
            }

            // Update Purchase status
            $purchase->update([
                'status' => 'received'
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Mercadería recepcionada e inventario actualizado exitosamente.',
                'reception_id' => $reception->id
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Reception Error: ' . $e->getMessage() . ' Trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Error al procesar la recepción.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
