<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sales\Sale;
use App\Models\Finance\Expense;
use App\Models\Finance\ExpenseSplit;
use App\Models\Finance\CashMovement;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceReportController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->query('start_date') ? Carbon::parse($request->query('start_date'))->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $endDate = $request->query('end_date') ? Carbon::parse($request->query('end_date'))->endOfDay() : Carbon::now()->endOfDay();
        $branchId = $request->query('branch_id');

        // Fetch Sales
        $salesQuery = \App\Models\Sales\SaleDetail::join('sales', 'sale_details.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->where('sales.status', 'paid');
            
        if ($branchId) {
            $salesQuery->where('sales.branch_id', $branchId);
        }

        $salesData = $salesQuery->select(DB::raw('DATE(sales.created_at) as date'), DB::raw('SUM(sale_details.subtotal) as amount'))
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        // Fetch Incomes from CashMovements (Adjustments/Surpluses)
        $movementsInQuery = CashMovement::whereBetween('created_at', [$startDate, $endDate])
            ->where('movement_type', 'income');
        if ($branchId) {
            $movementsInQuery->whereHas('cash_register', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $movementsInData = $movementsInQuery->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(amount) as amount'))
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        // Fetch Expenses
        $expensesQuery = ExpenseSplit::join('expenses', 'expense_splits.expense_id', '=', 'expenses.id')
            ->whereBetween('expense_splits.paid_at', [$startDate, $endDate])
            ->whereIn('expense_splits.status', ['paid', 'archived'])
            ->where('expense_splits.deducted_from_wallet', true);

        if ($branchId) {
            $expensesQuery->where('expenses.branch_id', $branchId);
        }

        $expensesData = $expensesQuery->select(DB::raw('DATE(expense_splits.paid_at) as date'), DB::raw('SUM(expense_splits.amount) as amount'))
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        // Fetch Expenses from CashMovements (Adjustments/Shortages)
        $movementsOutQuery = CashMovement::whereBetween('created_at', [$startDate, $endDate])
            ->where('movement_type', 'expense');
        if ($branchId) {
            $movementsOutQuery->whereHas('cash_register', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $movementsOutData = $movementsOutQuery->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(amount) as amount'))
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();


        // Aggregate into timeline array
        $timelineMap = [];

        // Pre-fill days between start and end
        for($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $dateStr = $date->format('Y-m-d');
            $timelineMap[$dateStr] = [
                'date' => $dateStr,
                'sales' => 0,
                'expenses' => 0,
                'profit' => 0
            ];
        }

        $totalSales = 0;
        $totalExpenses = 0;

        foreach ($salesData as $sale) {
            $dateStr = $sale->date;
            if (isset($timelineMap[$dateStr])) {
                $timelineMap[$dateStr]['sales'] += (float)$sale->amount;
                $timelineMap[$dateStr]['profit'] += (float)$sale->amount;
            }
            $totalSales += (float)$sale->amount;
        }
        
        foreach ($movementsInData as $movIn) {
            $dateStr = $movIn->date;
            if (isset($timelineMap[$dateStr])) {
                $timelineMap[$dateStr]['sales'] += (float)$movIn->amount;
                $timelineMap[$dateStr]['profit'] += (float)$movIn->amount;
            }
            $totalSales += (float)$movIn->amount;
        }

        foreach ($expensesData as $exp) {
            $dateStr = $exp->date;
            if (isset($timelineMap[$dateStr])) {
                $timelineMap[$dateStr]['expenses'] += (float)$exp->amount;
                $timelineMap[$dateStr]['profit'] -= (float)$exp->amount;
            }
            $totalExpenses += (float)$exp->amount;
        }
        
        foreach ($movementsOutData as $movOut) {
            $dateStr = $movOut->date;
            if (isset($timelineMap[$dateStr])) {
                $timelineMap[$dateStr]['expenses'] += (float)$movOut->amount;
                $timelineMap[$dateStr]['profit'] -= (float)$movOut->amount;
            }
            $totalExpenses += (float)$movOut->amount;
        }

        // Expenses Breakdown by Category
        $expensesByCategoryQuery = ExpenseSplit::join('expenses', 'expense_splits.expense_id', '=', 'expenses.id')
            ->whereBetween('expense_splits.paid_at', [$startDate, $endDate])
            ->whereIn('expense_splits.status', ['paid', 'archived'])
            ->where('expense_splits.deducted_from_wallet', true);
        
        if ($branchId) {
            $expensesByCategoryQuery->where('expenses.branch_id', $branchId);
        }

        $expensesByCategory = $expensesByCategoryQuery->select('expenses.category', DB::raw('SUM(expense_splits.amount) as amount'))
            ->groupBy('expenses.category')
            ->orderBy('amount', 'DESC')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->category ?: 'Sin Categoría',
                    'value' => (float)$item->amount
                ];
            });

        // Previous Period Calculations
        $daysDiff = $startDate->diffInDays($endDate) + 1;
        $prevEndDate = $startDate->copy()->subSecond();
        $prevStartDate = $prevEndDate->copy()->subDays($daysDiff)->startOfDay();

        $prevSalesQuery = \App\Models\Sales\SaleDetail::join('sales', 'sale_details.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$prevStartDate, $prevEndDate])
            ->where('sales.status', 'paid');
        if ($branchId) $prevSalesQuery->where('sales.branch_id', $branchId);
        $prevTotalSales = (float) $prevSalesQuery->sum('sale_details.subtotal');
        
        $prevMovementsInQuery = CashMovement::whereBetween('created_at', [$prevStartDate, $prevEndDate])
            ->where('movement_type', 'income');
        if ($branchId) {
            $prevMovementsInQuery->whereHas('cash_register', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $prevTotalSales += (float) $prevMovementsInQuery->sum('amount');

        $prevExpensesQuery = ExpenseSplit::join('expenses', 'expense_splits.expense_id', '=', 'expenses.id')
            ->whereBetween('expense_splits.paid_at', [$prevStartDate, $prevEndDate])
            ->whereIn('expense_splits.status', ['paid', 'archived'])
            ->where('expense_splits.deducted_from_wallet', true);
        if ($branchId) $prevExpensesQuery->where('expenses.branch_id', $branchId);
        $prevTotalExpenses = (float) $prevExpensesQuery->sum('expense_splits.amount');
        
        $prevMovementsOutQuery = CashMovement::whereBetween('created_at', [$prevStartDate, $prevEndDate])
            ->where('movement_type', 'expense');
        if ($branchId) {
            $prevMovementsOutQuery->whereHas('cash_register', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $prevTotalExpenses += (float) $prevMovementsOutQuery->sum('amount');
        
        $prevNetProfit = $prevTotalSales - $prevTotalExpenses;

        $calcGrowth = function($current, $previous) {
            if ($previous == 0) return $current > 0 ? 100 : 0;
            return (($current - $previous) / abs($previous)) * 100;
        };

        $salesGrowth = $calcGrowth($totalSales, $prevTotalSales);
        $expensesGrowth = $calcGrowth($totalExpenses, $prevTotalExpenses);
        $profitGrowth = $calcGrowth($totalSales - $totalExpenses, $prevNetProfit);

        return response()->json([
            'summary' => [
                'total_sales' => $totalSales,
                'total_expenses' => $totalExpenses,
                'net_profit' => $totalSales - $totalExpenses,
                'growth' => [
                    'sales' => $salesGrowth,
                    'expenses' => $expensesGrowth,
                    'profit' => $profitGrowth
                ]
            ],
            'timeline' => array_values($timelineMap),
            'expense_categories' => $expensesByCategory
        ]);
    }
}
