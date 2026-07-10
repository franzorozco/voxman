<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sales\Sale;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with([
            'customer.user.profile', 
            'user.profile', 
            'branch',
            'sale_details.product_variant.product',
            'sale_details.giftcard',
            'payments.payment_method',
            'giftcard_transactions.giftcard'
        ]);

        if (auth()->check() && !auth()->user()->can('view_sales_all_branches')) {
            $query->where('branch_id', auth()->user()->branch_id);
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('invoice_number', 'ILIKE', "%{$search}%");
        }

        // Sorting
        $sortBy = $request->query('sortBy', 'created_at');
        $sortDir = strtolower($request->query('sortDir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['created_at', 'total', 'subtotal'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = $request->query('per_page', 50);
        
        $summary = [
            'total_revenue' => (clone $query)->where('status', 'paid')->sum('total'),
            'total_sales' => (clone $query)->where('status', '!=', 'cancelled')->count(),
            'total_discount' => (clone $query)->where('status', 'paid')->sum('discount_total'),
            'average_ticket' => 0
        ];
        if ($summary['total_sales'] > 0) {
            $summary['average_ticket'] = $summary['total_revenue'] / $summary['total_sales'];
        }

        $paginated = $query->paginate($perPage);
        
        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total()
            ],
            'summary' => $summary
        ]);
    }

    public function show($id)
    {
        $sale = Sale::with([
            'customer.user.profile', 
            'user.profile', 
            'branch',
            'sale_details.product_variant.product',
            'sale_details.giftcard',
            'sale_details.owner.user.profile',
            'payments.payment_method',
            'shipments.address',
            'giftcard_transactions.giftcard',
            'sale_applied_discounts.discount'
        ])->findOrFail($id);

        if (auth()->check() && !auth()->user()->can('view_sales_all_branches')) {
            if ($sale->branch_id !== auth()->user()->branch_id) {
                abort(403, 'No tienes permiso para ver ventas de otras sucursales.');
            }
        }

        return response()->json($sale);
    }

    public function update(Request $request, $id)
    {
        $sale = Sale::with(['sale_details', 'giftcard_transactions', 'payments'])->findOrFail($id);

        $request->validate([
            'status' => 'required|string|in:pending,paid,cancelled,refunded',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            $oldStatus = $sale->status;
            $newStatus = $request->status;

            if ($oldStatus !== 'cancelled' && $newStatus === 'cancelled') {
                // 1. VALIDACION Y ANULACION DE GIFTCARDS
                $giftcardIdsFromDetails = $sale->sale_details->whereNotNull('gift_card_id')->pluck('gift_card_id')->toArray();
                $giftcardIdsFromTx = $sale->giftcard_transactions->where('type', 'issue')->pluck('giftcard_id')->toArray();
                
                $allGiftcardIds = array_unique(array_merge($giftcardIdsFromDetails, $giftcardIdsFromTx));

                if (!empty($allGiftcardIds)) {
                    $giftcards = \App\Models\Finance\Giftcard::whereIn('id', $allGiftcardIds)->get();
                    foreach ($giftcards as $gc) {
                        if ((float)$gc->current_balance < (float)$gc->initial_balance) {
                            throw new \Exception("No se puede cancelar la venta. La Giftcard {$gc->code} ya fue utilizada parcialmente.");
                        }
                    }

                    // Si pasamos validación, las desactivamos
                    foreach ($giftcards as $gc) {
                        $gc->is_active = false;
                        $gc->current_balance = 0;
                        $gc->save();

                        // Crear transacción de anulación
                        \App\Models\Finance\GiftcardTransaction::create([
                            'giftcard_id' => $gc->id,
                            'type' => 'refund',
                            'amount' => -$gc->initial_balance,
                            'sale_id' => $sale->id,
                            'notes' => 'Anulación por venta cancelada'
                        ]);
                    }
                }

                // 2. INVENTARIO: Devolver productos físicos
                foreach ($sale->sale_details as $detail) {
                    if ($detail->variant_id) {
                        $inventory = \App\Models\Inventory\Inventory::firstOrCreate(
                            ['branch_id' => $sale->branch_id, 'variant_id' => $detail->variant_id],
                            ['stock' => 0, 'min_stock' => 0]
                        );

                        $stockBefore = $inventory->stock;
                        $inventory->stock += $detail->quantity;
                        $inventory->save();

                        \App\Models\Inventory\InventoryMovement::create([
                            'variant_id' => $detail->variant_id,
                            'branch_id' => $sale->branch_id,
                            'movement_type' => 'return',
                            'quantity' => $detail->quantity,
                            'stock_before' => $stockBefore,
                            'stock_after' => $inventory->stock,
                            'notes' => "Anulación de venta " . ($sale->invoice_number ?? $sale->id)
                        ]);
                    }
                }

                // 3. PAGOS: Marcarlos como failed
                foreach ($sale->payments as $payment) {
                    $payment->status = 'failed';
                    $payment->save();
                }
            }

            $sale->status = $newStatus;
            
            if ($request->has('notes')) {
                $sale->notes = $request->notes;
            }

            $sale->save();

            DB::commit();

            return response()->json($sale);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function destroy($id)
    {
        $sale = Sale::findOrFail($id);
        $sale->update(['status' => 'cancelled']);
        $sale->delete(); // Soft delete

        return response()->json(['message' => 'Sale cancelled successfully']);
    }
}
