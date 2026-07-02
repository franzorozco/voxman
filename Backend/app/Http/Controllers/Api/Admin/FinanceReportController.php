<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sales\Sale;
use App\Models\Finance\Expense;
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
        $salesQuery = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled'); // Assuming 'cancelled' is ignored, change if VOXman uses different status
            
        if ($branchId) {
            $salesQuery->where('branch_id', $branchId);
        }

        $salesData = $salesQuery->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as amount'))
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        // Fetch Expenses
        $expensesQuery = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled');

        if ($branchId) {
            $expensesQuery->where('branch_id', $branchId);
        }

        $expensesData = $expensesQuery->select(DB::raw('DATE(expense_date) as date'), DB::raw('SUM(amount) as amount'))
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

        foreach ($expensesData as $exp) {
            $dateStr = $exp->date;
            if (isset($timelineMap[$dateStr])) {
                $timelineMap[$dateStr]['expenses'] += (float)$exp->amount;
                $timelineMap[$dateStr]['profit'] -= (float)$exp->amount;
            }
            $totalExpenses += (float)$exp->amount;
        }

        // Expenses Breakdown by Category
        $expensesByCategoryQuery = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled');
        
        if ($branchId) {
            $expensesByCategoryQuery->where('branch_id', $branchId);
        }

        $expensesByCategory = $expensesByCategoryQuery->select('category', DB::raw('SUM(amount) as amount'))
            ->groupBy('category')
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

        $prevSalesQuery = Sale::whereBetween('created_at', [$prevStartDate, $prevEndDate])
            ->where('status', '!=', 'cancelled');
        if ($branchId) $prevSalesQuery->where('branch_id', $branchId);
        $prevTotalSales = (float) $prevSalesQuery->sum('total');

        $prevExpensesQuery = Expense::whereBetween('expense_date', [$prevStartDate, $prevEndDate])
            ->where('status', '!=', 'cancelled');
        if ($branchId) $prevExpensesQuery->where('branch_id', $branchId);
        $prevTotalExpenses = (float) $prevExpensesQuery->sum('amount');
        
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
