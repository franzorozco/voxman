<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Actors\Owner;
use App\Models\Sales\SaleDetail;
use App\Models\Finance\OwnerPayment;
use App\Models\Finance\ExpenseSplit;
use App\Models\Finance\Expense;
use Illuminate\Support\Facades\DB;

class FinanceDashboardController extends Controller
{
    public function index(Request $request)
    {
        $owners = Owner::with('user.profile')->where('is_active', true)->get();
        
        $data = [];
        
        $totalStoreRevenue = 0;
        $totalStoreExpenses = 0;
        
        foreach ($owners as $owner) {
            // 1. Ganancias por Ventas (Solo ventas pagadas)
            $salesRevenue = SaleDetail::whereHas('sale', function($q) {
                $q->where('status', 'paid');
            })
            ->where('owner_id', $owner->id)
            ->sum(DB::raw('subtotal - discount'));
            
            // 2. Gastos Asumidos
            $expensesAssumed = ExpenseSplit::where('owner_id', $owner->id)->sum('amount');
            
            // 3. Retiros
            $withdrawals = OwnerPayment::where('owner_id', $owner->id)->where('type', 'withdrawal')->sum('total_amount');
            
            // 4. Inyecciones
            $deposits = OwnerPayment::where('owner_id', $owner->id)->where('type', 'deposit')->sum('total_amount');
            
            // 5. Saldo Actual
            $currentBalance = $salesRevenue - $expensesAssumed - $withdrawals + $deposits;
            
            $data['owners'][] = [
                'owner_id' => $owner->id,
                'name' => $owner->user->profile->first_name . ' ' . $owner->user->profile->last_name,
                'sales_revenue' => $salesRevenue,
                'expenses_assumed' => $expensesAssumed,
                'withdrawals' => $withdrawals,
                'deposits' => $deposits,
                'current_balance' => $currentBalance
            ];
            
            $totalStoreRevenue += $salesRevenue;
        }
        
        // Gastos globales del mes actual (para graficos rápidos)
        $totalStoreExpenses = Expense::sum('amount');
        
        $data['summary'] = [
            'total_revenue' => $totalStoreRevenue,
            'total_expenses' => $totalStoreExpenses,
            'net_profit' => $totalStoreRevenue - $totalStoreExpenses
        ];

        return response()->json($data);
    }
}
