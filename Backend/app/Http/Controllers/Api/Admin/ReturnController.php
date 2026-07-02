<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sales\Returns;
use App\Models\Inventory\Inventory;
use App\Models\Inventory\InventoryMovement;
use App\Models\Inventory\QuarantineItem;
use Illuminate\Http\Request;

class ReturnController extends Controller
{
    public function index(Request $request)
    {
        $query = Returns::with([
            'sale_detail.sale.customer',
            'sale_detail.product_variant.product'
        ])->orderBy('created_at', 'desc');

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

    public function show($id)
    {
        $return = Returns::with([
            'sale_detail.sale.customer',
            'sale_detail.sale.branch',
            'sale_detail.product_variant.product.images',
            'sale_detail.product_variant.size',
            'sale_detail.product_variant.fit'
        ])->findOrFail($id);

        return response()->json($return);
    }

    public function approve(Request $request, $id)
    {
        $return = Returns::with('sale_detail.sale')->findOrFail($id);
        
        if ($return->status === 'approved') {
            return response()->json(['message' => 'Esta devolución ya fue aprobada anteriormente.'], 400);
        }

        $return->status = 'approved';
        $return->refund_method = $request->input('refund_method', 'cash');
        $return->refund_amount = $request->input('refund_amount', $return->sale_detail->final_price * $return->quantity);
        $return->restock_destination = $request->input('restock_destination', 'inventory');
        $return->updated_at = now();
        $return->save();

        $variantId = $return->sale_detail->variant_id;
        $branchId = $return->sale_detail->sale->branch_id;
        
        if ($branchId && $variantId) {
            if ($return->restock_destination === 'inventory') {
                $inventory = Inventory::firstOrCreate(
                    ['branch_id' => $branchId, 'variant_id' => $variantId],
                    ['stock' => 0]
                );
                
                $inventory->stock += $return->quantity;
                $inventory->save();
                
                InventoryMovement::create([
                    'inventory_id' => $inventory->id,
                    'type' => 'in',
                    'quantity' => $return->quantity,
                    'reason' => 'Customer Return Approved',
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

        return response()->json([
            'message' => 'Devolución aprobada y stock restituido.',
            'return' => $return
        ]);
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
