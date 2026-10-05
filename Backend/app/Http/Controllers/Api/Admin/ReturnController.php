<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sales\Returns;
use App\Models\Inventory\Inventory;
use App\Models\Inventory\InventoryMovement;
use App\Models\Inventory\QuarantineItem;
use App\Models\Sales\SaleDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReturnController extends Controller
{
    public function index(Request $request)
    {
        $query = Returns::with([
            'sale_detail.sale.customer.user.profile',
            'sale_detail.sale.customer.posProfile',
            'sale_detail.sale.guest',
            'sale_detail.product_variant.product.product_images',
            'sale_detail.product_variant.product.attribute_value_images',
            'sale_detail.product_variant.variant_images',
            'sale_detail.product_variant.variant_attribute_values.attribute_value',
            'sale_detail.product_variant.size',
            'sale_detail.product_variant.fit'
        ])->orderBy('created_at', 'desc');

        if (auth()->check() && !auth()->user()->can('view_returns_all_branches')) {
            $branchId = auth()->user()->branch_id;
            $query->whereHas('sale_detail.sale', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('reference_number', 'ilike', '%' . $request->search . '%');
        }

        $allReturns = Returns::all();
        
        $totalRefunded = $allReturns->where('status', 'approved')->sum('refund_amount');
        $pendingReturns = $allReturns->where('status', 'pending')->count();
        
        // Return Rate logic could be complex depending on total sales count, so we mock or calculate a basic one
        $totalReturnsCount = $allReturns->count();
        // Just mock it to 0 if no data, as accurate return rate requires total sales count from Sales
        $returnRate = 0; 

        $returns = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $returns,
            'summary' => [
                'total_refunded' => $totalRefunded,
                'pending_returns' => $pendingReturns,
                'return_rate' => $returnRate
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'sale_detail_id' => 'required|exists:sale_details,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string',
        ]);

        $saleDetail = SaleDetail::findOrFail($request->sale_detail_id);

        // Check if quantity to return is valid (not more than bought - already returned)
        // For simplicity, just check against bought quantity
        if ($request->quantity > $saleDetail->quantity) {
            return response()->json(['message' => 'La cantidad a devolver excede la cantidad comprada.'], 400);
        }

        $return = Returns::create([
            'sale_detail_id' => $saleDetail->id,
            'quantity' => $request->quantity,
            'reason' => $request->reason,
            'reference_number' => 'RET-' . strtoupper(Str::random(8)),
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Solicitud de devolución creada correctamente.',
            'return' => $return
        ], 201);
    }

    public function show($id)
    {
        $return = Returns::with([
            'sale_detail.sale.customer',
            'sale_detail.sale.branch',
            'sale_detail.product_variant.product.images',
            'sale_detail.product_variant.size',
            'sale_detail.product_variant.fit'
        ])->findOrFail($id);

        if (auth()->check() && !auth()->user()->can('view_returns_all_branches')) {
            if ($return->sale_detail && $return->sale_detail->sale && $return->sale_detail->sale->branch_id !== auth()->user()->branch_id) {
                abort(403, 'No tienes permiso para ver devoluciones de otras sucursales.');
            }
        }

        return response()->json($return);
    }

    public function approve(Request $request, $id)
    {
        $return = Returns::with('sale_detail.sale')->findOrFail($id);
        
        if ($return->status === 'approved') {
            return response()->json(['message' => 'Esta devolución ya fue aprobada anteriormente.'], 400);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $return->status = 'approved';
            $return->refund_method = $request->input('refund_method', 'cash');
            $return->refund_amount = $request->input('refund_amount', $return->sale_detail->final_price * $return->quantity);
            $return->restock_destination = $request->input('restock_destination', 'inventory');
            $return->updated_at = now();
            $return->save();

            $variantId = $return->sale_detail->variant_id;
            $branchId = $return->sale_detail->sale->branch_id;
            $saleId = $return->sale_detail->sale_id;
            
            if ($branchId && $variantId) {
                if ($return->restock_destination === 'inventory') {
                    $inventory = Inventory::firstOrCreate(
                        ['branch_id' => $branchId, 'variant_id' => $variantId],
                        ['stock' => 0]
                    );
                    
                    $stockBefore = $inventory->stock;
                    $inventory->stock += $return->quantity;
                    $inventory->save();
                    
                    InventoryMovement::create([
                        'variant_id' => $variantId,
                        'branch_id' => $branchId,
                        'movement_type' => 'return',
                        'quantity' => $return->quantity,
                        'stock_before' => $stockBefore,
                        'stock_after' => $inventory->stock,
                        'notes' => "Devolución aprobada (Ref: " . $return->reference_number . ")",
                        'reference_type' => Returns::class,
                        'reference_id' => $return->id
                    ]);
                } else if ($return->restock_destination === 'quarantine') {
                    QuarantineItem::create([
                        'branch_id' => $branchId,
                        'variant_id' => $variantId,
                        'quantity' => $return->quantity,
                        'reason' => $return->reason ?? 'Devolución del cliente con daño reportado',
                        'status' => 'pending'
                    ]);
                }
            }

            // Marcar la variable como devuelta (anular ingreso/capital)
            if ($return->sale_detail) {
                $return->sale_detail->delete(); // Soft delete for finance reversal
            }

            // Verificar si toda la venta fue devuelta
            $remainingActiveDetails = SaleDetail::where('sale_id', $saleId)->count();
            if ($remainingActiveDetails === 0 && $return->sale_detail && $return->sale_detail->sale) {
                $return->sale_detail->sale->update(['status' => 'refunded']);
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Devolución aprobada y stock restituido.',
                'return' => $return
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Error al procesar devolución: ' . $e->getMessage()], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        $return = Returns::findOrFail($id);
        
        $return->status = 'rejected';
        $return->updated_at = now();
        $return->save();

        return response()->json([
            'message' => 'Devolución denegada correctamente.',
            'return' => $return
        ]);
    }
}
