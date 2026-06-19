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
        
        return response()->json($query->paginate($perPage));
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
            'giftcard_transactions.giftcard'
        ])->findOrFail($id);

        return response()->json($sale);
    }

    public function update(Request $request, $id)
    {
        $sale = Sale::findOrFail($id);

        $request->validate([
            'status' => 'required|string|in:pending,completed,cancelled,refunded',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            // If cancelling a completed sale, we might need to restore inventory.
            // For now, we simply update the status.
            $sale->status = $request->status;
            
            if ($request->has('notes')) {
                $sale->notes = $request->notes;
            }

            $sale->save();

            DB::commit();

            return response()->json($sale);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating sale status', 'error' => $e->getMessage()], 500);
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
