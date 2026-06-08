<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Inventory\Inventory;
use App\Models\Inventory\InventoryMovement;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    /**
     * List all inventories with variant and product data, branch, etc.
     */
    public function index(Request $request)
    {
        $query = Inventory::with([
            'branch',
            'variant.product.product_images',
            'variant.product.attribute_value_images',
            'variant.product.category',
            'variant.variant_images',
            'variant.size',
            'variant.fit',
            'variant.variant_attribute_values.attribute_value.attribute'
        ]);

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('product_id')) {
            $query->whereHas('variant', function ($q) use ($request) {
                $q->where('product_id', $request->product_id);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('variant.product', function ($q2) use ($search) {
                    $q2->where('name', 'ilike', '%' . $search . '%')
                       ->orWhere('sku', 'ilike', '%' . $search . '%');
                })
                ->orWhereHas('variant', function ($q3) use ($search) {
                    $q3->where('sku', 'ilike', '%' . $search . '%')
                       ->orWhere('barcode', 'ilike', '%' . $search . '%');
                });
            });
        }

        if ($request->filled('status')) {
            if ($request->status === 'low_stock') {
                $query->whereColumn('stock', '<=', 'min_stock')->where('stock', '>', 0);
            } elseif ($request->status === 'out_of_stock') {
                $query->where('stock', '<=', 0);
            } elseif ($request->status === 'in_stock') {
                $query->whereColumn('stock', '>', 'min_stock');
            }
        }

        $inventories = $query->orderBy('branch_id')->orderBy('variant_id')->paginate($request->get('per_page', 1000));

        return response()->json($inventories);
    }

    /**
     * Manually adjust stock
     */
    public function adjust(Request $request)
    {
        $request->validate([
            'variant_id' => 'required|uuid',
            'branch_id' => 'required|uuid',
            'quantity' => 'required|integer|not_in:0', // + sum, - sub
            'reference' => 'required|string|max:255'
        ]);

        DB::beginTransaction();

        try {
            $inventory = Inventory::firstOrCreate(
                [
                    'variant_id' => $request->variant_id,
                    'branch_id' => $request->branch_id,
                ],
                [
                    'stock' => 0,
                    'min_stock' => 5
                ]
            );

            $newStock = $inventory->stock + $request->quantity;

            if ($newStock < 0) {
                return response()->json(['message' => 'Stock cannot be negative.'], 400);
            }

            $inventory->update(['stock' => $newStock]);

            InventoryMovement::create([
                'variant_id' => $request->variant_id,
                'branch_id' => $request->branch_id,
                'created_by' => auth()->id(),
                'movement_type' => 'adjustment',
                'quantity' => abs($request->quantity),
                'stock_before' => $inventory->stock - $request->quantity,
                'stock_after' => $newStock,
                'reference' => 'Ajuste: ' . $request->reference
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Stock actualizado exitosamente.',
                'inventory' => $inventory->load('variant.product', 'branch')
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('AdjustStock Error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Mass manually adjust stock
     */
    public function batchAdjust(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|uuid',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|uuid',
            'items.*.quantity' => 'required|integer|not_in:0',
            'reference' => 'nullable|string|max:255'
        ]);

        DB::beginTransaction();

        try {
            $updatedInventories = [];

            foreach ($request->items as $item) {
                $inventory = Inventory::firstOrCreate(
                    [
                        'variant_id' => $item['variant_id'],
                        'branch_id' => $request->branch_id,
                    ],
                    [
                        'stock' => 0,
                        'min_stock' => 5
                    ]
                );

                $newStock = $inventory->stock + $item['quantity'];

                if ($newStock < 0) {
                    throw new \Exception("Stock no puede ser negativo para alguna variante.");
                }

                $inventory->stock = $newStock;
                $inventory->save();

                InventoryMovement::create([
                    'variant_id' => $item['variant_id'],
                    'branch_id' => $request->branch_id,
                    'created_by' => auth()->id(),
                    'movement_type' => 'adjustment',
                    'quantity' => abs($item['quantity']),
                    'stock_before' => $inventory->stock - $item['quantity'],
                    'stock_after' => $newStock,
                    'reference' => 'Ajuste Masivo: ' . ($request->reference ?? '')
                ]);

                $updatedInventories[] = $inventory->load('variant.product');
            }

            DB::commit();

            return response()->json([
                'message' => 'Stock actualizado masivamente.',
                'inventories' => $updatedInventories
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('BatchAdjust Error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Transfer stock between branches
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'variant_id' => 'required|uuid',
            'from_branch_id' => 'required|uuid',
            'to_branch_id' => 'required|uuid|different:from_branch_id',
            'quantity' => 'required|integer|min:1',
            'reference' => 'nullable|string|max:255'
        ]);

        DB::beginTransaction();

        try {
            $sourceInventory = Inventory::where('variant_id', $request->variant_id)
                ->where('branch_id', $request->from_branch_id)
                ->first();

            if (!$sourceInventory || $sourceInventory->stock < $request->quantity) {
                return response()->json(['message' => 'Stock insuficiente en la sucursal de origen.'], 400);
            }

            // Deduct from source
            $stockBeforeSource = $sourceInventory->stock;
            $sourceInventory->decrement('stock', $request->quantity);

            InventoryMovement::create([
                'variant_id' => $request->variant_id,
                'branch_id' => $request->from_branch_id,
                'created_by' => auth()->id(),
                'movement_type' => 'transfer_out',
                'quantity' => $request->quantity,
                'stock_before' => $stockBeforeSource,
                'stock_after' => $stockBeforeSource - $request->quantity,
                'reference' => 'Transferencia a otra sucursal: ' . $request->reference
            ]);

            // Add to destination
            $destInventory = Inventory::firstOrCreate(
                [
                    'variant_id' => $request->variant_id,
                    'branch_id' => $request->to_branch_id,
                ],
                [
                    'stock' => 0,
                    'min_stock' => 5
                ]
            );

            $stockBeforeDest = $destInventory->stock;
            $destInventory->increment('stock', $request->quantity);

            InventoryMovement::create([
                'variant_id' => $request->variant_id,
                'branch_id' => $request->to_branch_id,
                'created_by' => auth()->id(),
                'movement_type' => 'transfer_in',
                'quantity' => $request->quantity,
                'stock_before' => $stockBeforeDest,
                'stock_after' => $stockBeforeDest + $request->quantity,
                'reference' => 'Transferencia recibida de otra sucursal: ' . $request->reference
            ]);

            DB::commit();

            return response()->json(['message' => 'Transferencia realizada con éxito.'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('TransferStock Error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * List inventory movements history
     */
    public function movements(Request $request)
    {
        $query = InventoryMovement::with([
            'branch',
            'variant' => fn($q) => $q->withTrashed(),
            'variant.product' => fn($q) => $q->withTrashed(),
            'variant.size',
            'variant.fit',
            'variant.variant_attribute_values.attribute_value.attribute',
            'user.profile'
        ])->orderBy('created_at', 'desc');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('type')) {
            $query->where('movement_type', $request->type); // in, out, adjustment
        }

        $movements = $query->paginate($request->get('per_page', 20));

        return response()->json($movements);
    }
}