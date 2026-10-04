<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Inventory\QuarantineItem;
use App\Models\Inventory\Inventory;
use App\Models\Inventory\InventoryMovement;
use Illuminate\Support\Facades\DB;

class QuarantineController extends Controller
{
    public function index(Request $request)
    {
        $query = QuarantineItem::with([
            'purchaseReception.purchase.supplier',
            'variant.product.product_images', // Para la foto base
            'variant.product.attribute_value_images', // Para foto de color/atributo
            'variant.variant_images',         // Para la foto especifica de la variante
            'variant.variant_attribute_values', // Para saber que atributo tiene la variante
            'branch'
        ]);

        if ($request->status === 'resolved') {
            $query->where('status', 'resolved');
        } else {
            $query->where('status', '!=', 'resolved');
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $items = $query->orderBy('created_at', 'desc')->get();

        return response()->json($items);
    }

    public function resolve(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:return,discard,convert',
            'quantity' => 'required|integer|min:1',
            'create_quick_variant' => 'nullable|boolean',
            'product_id' => 'required_if:create_quick_variant,true|nullable|uuid|exists:products,id',
            'target_variant_id' => 'nullable|uuid|exists:product_variants,id',
            'notes' => 'nullable|string'
        ]);

        if ($request->action === 'convert' && !$request->create_quick_variant && !$request->target_variant_id) {
            return response()->json(['message' => 'El target_variant_id es requerido para convertir.'], 422);
        }

        try {
            DB::beginTransaction();

            $quarantineItem = QuarantineItem::findOrFail($id);
            
            $pendingQuantity = $quarantineItem->quantity - $quarantineItem->resolved_quantity;

            if ($request->quantity > $pendingQuantity) {
                return response()->json(['message' => 'La cantidad a resolver es mayor a la pendiente.'], 422);
            }

            if ($request->action === 'convert') {
                $targetVariantId = $request->target_variant_id;

                if ($request->create_quick_variant && $request->product_id) {
                    // Create a quick variant based on the original variant's price
                    $originalVariant = \App\Models\Catalog\ProductVariant::find($quarantineItem->variant_id);
                    $newVariant = \App\Models\Catalog\ProductVariant::create([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'product_id' => $request->product_id,
                        'sku' => ($originalVariant ? $originalVariant->sku : 'VAR') . '-MERMA-' . substr((string)\Illuminate\Support\Str::uuid(), 0, 4),
                        'price' => $originalVariant ? $originalVariant->price : 0, // Should probably be discounted, but can be updated later
                        'status' => 'active'
                    ]);
                    $targetVariantId = $newVariant->id;
                }

                // Inyectar inventario a la nueva variante
                $inventory = Inventory::firstOrCreate(
                    [
                        'branch_id' => $quarantineItem->branch_id,
                        'variant_id' => $targetVariantId
                    ],
                    [
                        'stock' => 0,
                        'min_stock' => 0
                    ]
                );

                $stockBefore = $inventory->stock;
                $inventory->stock += $request->quantity;
                $inventory->save();

                InventoryMovement::create([
                    'variant_id' => $targetVariantId,
                    'branch_id' => $quarantineItem->branch_id,
                    'created_by' => auth()->id() ?? \App\Models\Core\User::first()->id,
                    'movement_type' => 'adjustment', // Usamos adjustment para ingresos manuales/conversiones
                    'quantity' => $request->quantity,
                    'reference' => 'Conversión de Cuarentena #' . substr($quarantineItem->id, 0, 8),
                    'stock_before' => $stockBefore,
                    'stock_after' => $inventory->stock,
                    'reference_type' => 'quarantine_resolution',
                    'reference_id' => $quarantineItem->id,
                    'notes' => 'Conversión de merma. ' . $request->notes
                ]);
            } elseif ($request->action === 'return') {
                // Registrar devolución al proveedor en la tabla supplier_returns si es necesario
                $purchaseId = $quarantineItem->purchaseReception->purchase_id ?? null;
                if ($purchaseId) {
                    \DB::table('supplier_returns')->insert([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'supplier_id' => $quarantineItem->purchaseReception->purchase->supplier_id,
                        'purchase_id' => $purchaseId,
                        'variant_id' => $quarantineItem->variant_id,
                        'quantity' => $request->quantity,
                        'reason' => 'Devolución de merma: ' . $request->notes,
                        'created_at' => now(),
                    ]);
                }
            }

            $quarantineItem->resolved_quantity += $request->quantity;
            
            // Adjuntar nota al registro
            $newNote = "[" . date('Y-m-d H:i') . "] ACCIÓN: " . strtoupper($request->action) . " | CANT: " . $request->quantity . " | NOTA: " . $request->notes;
            $quarantineItem->notes = $quarantineItem->notes ? $quarantineItem->notes . "\n" . $newNote : $newNote;

            if ($quarantineItem->resolved_quantity >= $quarantineItem->quantity) {
                $quarantineItem->status = 'resolved';
            } else {
                $quarantineItem->status = 'partially_resolved';
            }

            $quarantineItem->save();

            DB::commit();

            return response()->json([
                'message' => 'Merma resuelta exitosamente.',
                'item' => $quarantineItem
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al resolver merma.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
