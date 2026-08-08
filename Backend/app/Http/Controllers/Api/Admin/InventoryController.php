<?php

namespace App\Http\Controllers\Api\Admin;

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
        ])
        ->select('inventories.*') // Add this so the * doesn't override reserved_stock
        ->addSelect([
            'reserved_stock' => \App\Models\Base\StockReservation::selectRaw('COALESCE(SUM(quantity), 0)')
                ->whereColumn('variant_id', 'inventories.variant_id')
                ->whereColumn('branch_id', 'inventories.branch_id')
                ->where('status', 'reserved')
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

        if ($request->filled('category_id')) {
            $query->whereHas('variant.product', function ($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        if ($request->filled('brand_id')) {
            $query->whereHas('variant.product', function ($q) use ($request) {
                $q->where('brand_id', $request->brand_id);
            });
        }

        if ($request->filled('min_price')) {
            $query->whereHas('variant', function ($q) use ($request) {
                $q->where('price', '>=', $request->min_price);
            });
        }

        if ($request->filled('max_price')) {
            $query->whereHas('variant', function ($q) use ($request) {
                $q->where('price', '<=', $request->max_price);
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

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('variant', function($q2) use ($search) {
                    $q2->where('sku', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%")
                      ->orWhereHas('product', function($q3) use ($search) {
                          $q3->where('name', 'like', "%{$search}%");
                      });
                })->orWhere('reference', 'like', "%{$search}%");
            });
        }

        $movements = $query->paginate($request->get('per_page', 20));

        return response()->json($movements);
    }

    public function stats(Request $request)
    {
        $branchId = $request->get('branch_id');

        $query = Inventory::with('variant');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $inventories = $query->get();

        $totalItems = 0;
        $totalCostValue = 0;
        $totalRetailValue = 0;
        $lowStockCount = 0;

        foreach ($inventories as $inv) {
            $stock = (int)$inv->stock;
            if ($stock > 0) {
                $totalItems += $stock;
                if ($inv->variant) {
                    $totalCostValue += ($inv->variant->cost * $stock);
                    $totalRetailValue += ($inv->variant->price * $stock);
                }
                if ($stock <= $inv->min_stock) {
                    $lowStockCount++;
                }
            } else if ($stock <= 0) {
                $lowStockCount++; // Agotados también cuentan como alerta de bajo stock
            }
        }

        return response()->json([
            'total_items' => $totalItems,
            'total_cost_value' => $totalCostValue,
            'total_retail_value' => $totalRetailValue,
            'low_stock_alerts' => $lowStockCount
        ]);
    }

    public function audit(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|uuid',
            'items' => 'required|array',
            'items.*.variant_id' => 'required|uuid',
            'items.*.actual_stock' => 'required|numeric',
        ]);

        $userId = auth()->id();
        $branchId = $request->branch_id;

        DB::beginTransaction();

        try {
            foreach ($request->items as $item) {
                $variantId = $item['variant_id'];
                $actualStock = (int)$item['actual_stock'];

                $inventory = Inventory::firstOrCreate(
                    [
                        'variant_id' => $variantId,
                        'branch_id' => $branchId,
                    ],
                    [
                        'stock' => 0,
                        'min_stock' => 5
                    ]
                );

                $difference = $actualStock - $inventory->stock;

                if ($difference != 0) {
                    InventoryMovement::create([
                        'variant_id' => $variantId,
                        'branch_id' => $branchId,
                        'created_by' => $userId,
                        'movement_type' => 'adjustment',
                        'quantity' => $difference,
                        'reference' => 'Auditoría Física',
                        'stock_before' => $inventory->stock,
                        'stock_after' => $actualStock,
                        'notes' => 'Ajuste automático por auditoría física'
                    ]);

                    $inventory->update(['stock' => $actualStock]);
                }
            }

            DB::commit();

            return response()->json(['message' => 'Auditoría guardada exitosamente.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al guardar la auditoría.', 'error' => $e->getMessage()], 500);
        }
    }
}