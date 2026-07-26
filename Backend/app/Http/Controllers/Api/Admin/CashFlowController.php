<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Branch\Branch;
use App\Models\Finance\Expense;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentMethod;
use App\Models\Finance\CashTransfer;
use App\Models\Finance\CashRegister;
use App\Models\Finance\CashMovement;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CashFlowController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->query('period', 'all');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if ($startDate && $endDate) {
            $startDate = \Carbon\Carbon::parse($startDate)->startOfDay();
            $endDate = \Carbon\Carbon::parse($endDate)->endOfDay();
        } elseif ($period !== 'all') {
            $endDate = now()->endOfDay();
            if ($period === 'today') {
                $startDate = now()->startOfDay();
            } elseif ($period === 'week') {
                $startDate = now()->startOfWeek();
            } elseif ($period === 'month') {
                $startDate = now()->startOfMonth();
            } else {
                $startDate = now()->startOfMonth();
            }
        } else {
            $startDate = now()->startOfMonth();
            $endDate = now()->endOfDay();
        }

        $cashMethod = PaymentMethod::where('name', 'Efectivo')->first();
        $cashMethodId = $cashMethod ? $cashMethod->id : null;
        $giftcardMethodIds = PaymentMethod::where('name', 'ILIKE', '%giftcard%')->pluck('id')->toArray();

        $branches = Branch::where('is_active', true)->get();
        
        $data = [
            'bank_balance' => 0,
            'branches' => [],
            'summary' => [
                'total_cash' => 0,
                'total_bank' => 0
            ]
        ];

        // --- Bank Operations ---
        $bankQuery = Payment::where('payment_method_id', '!=', $cashMethodId);
        if (!empty($giftcardMethodIds)) {
            $bankQuery->whereNotIn('payment_method_id', $giftcardMethodIds);
        }
        if ($startDate && $endDate) {
            $bankQuery->whereBetween('created_at', [$startDate, $endDate]);
        }
        $totalBankSales = $bankQuery->sum('amount');
        
        $bankExpensesQuery = \App\Models\Finance\ExpenseSplit::whereIn('status', ['paid', 'archived'])
            ->where('fund_source', 'bank')
            ->where('deducted_from_wallet', true);
        if ($startDate && $endDate) {
            $bankExpensesQuery->whereBetween('paid_at', [$startDate, $endDate]);
        }
        $totalBankExpenses = $bankExpensesQuery->sum('amount');

        $transfersInQuery = CashTransfer::where('status', 'completed')->whereNull('to_branch_id');
        $transfersOutQuery = CashTransfer::where('status', 'completed')->whereNull('from_branch_id');
        if ($startDate && $endDate) {
            $transfersInQuery->whereBetween('transfer_date', [$startDate, $endDate->format('Y-m-d')]);
            $transfersOutQuery->whereBetween('transfer_date', [$startDate, $endDate->format('Y-m-d')]);
        }
        $bankTransfersIn = $transfersInQuery->sum('amount');
        $bankTransfersOut = $transfersOutQuery->sum('amount');
        
        // Owner Payments to Bank
        $ownerBankDepositsQuery = \App\Models\Finance\OwnerPayment::whereIn('status', ['paid', 'archived'])->where('fund_source', 'bank')->where('type', 'deposit');
        $ownerBankWithdrawalsQuery = \App\Models\Finance\OwnerPayment::whereIn('status', ['paid', 'archived'])->where('fund_source', 'bank')->where('type', 'withdrawal');
        if ($startDate && $endDate) {
            $ownerBankDepositsQuery->whereBetween('payment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
            $ownerBankWithdrawalsQuery->whereBetween('payment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
        }
        $ownerBankDeposits = $ownerBankDepositsQuery->sum('total_amount');
        $ownerBankWithdrawals = $ownerBankWithdrawalsQuery->sum('total_amount');

        $data['bank_balance'] = $totalBankSales - $totalBankExpenses + $bankTransfersIn - $bankTransfersOut + $ownerBankDeposits - $ownerBankWithdrawals;
        $data['summary']['total_bank'] = $data['bank_balance'];

        // --- Daily Flow calculation ---
        $dailyFlow = [];
        $currentDate = $startDate->copy();
        while ($currentDate->lte($endDate)) {
            $dateStr = $currentDate->format('Y-m-d');
            $dailyFlow[$dateStr] = ['date' => $dateStr, 'income' => 0, 'expense' => 0, 'balance' => 0];
            $currentDate->addDay();
        }

        // Fill incomes
        $dailyIncomes = Payment::selectRaw('DATE(created_at) as date, SUM(amount) as total')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('date')->pluck('total', 'date');
        foreach ($dailyIncomes as $date => $total) {
            if (isset($dailyFlow[$date])) $dailyFlow[$date]['income'] += $total;
        }
        $dailyMovementsIn = CashMovement::where('movement_type', 'income')->selectRaw('DATE(created_at) as date, SUM(amount) as total')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('date')->pluck('total', 'date');
        foreach ($dailyMovementsIn as $date => $total) {
            if (isset($dailyFlow[$date])) $dailyFlow[$date]['income'] += $total;
        }
        $dailyOwnerDeposits = \App\Models\Finance\OwnerPayment::whereIn('status', ['paid', 'archived'])->where('type', 'deposit')
            ->selectRaw('DATE(payment_date) as date, SUM(total_amount) as total')
            ->whereBetween('payment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->groupBy('date')->pluck('total', 'date');
        foreach ($dailyOwnerDeposits as $date => $total) {
            if (isset($dailyFlow[$date])) $dailyFlow[$date]['income'] += $total;
        }

        // Fill expenses
        $dailyExpenses = \App\Models\Finance\ExpenseSplit::whereIn('status', ['paid', 'archived'])
            ->where('deducted_from_wallet', true)
            ->selectRaw('DATE(paid_at) as date, SUM(amount) as total')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->groupBy('date')->pluck('total', 'date');
        foreach ($dailyExpenses as $date => $total) {
            if (isset($dailyFlow[$date])) $dailyFlow[$date]['expense'] += $total;
        }
        $dailyMovementsOut = CashMovement::where('movement_type', 'expense')->selectRaw('DATE(created_at) as date, SUM(amount) as total')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('date')->pluck('total', 'date');
        foreach ($dailyMovementsOut as $date => $total) {
            if (isset($dailyFlow[$date])) $dailyFlow[$date]['expense'] += $total;
        }
        $dailyOwnerWithdrawals = \App\Models\Finance\OwnerPayment::whereIn('status', ['paid', 'archived'])->where('type', 'withdrawal')
            ->selectRaw('DATE(payment_date) as date, SUM(total_amount) as total')
            ->whereBetween('payment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->groupBy('date')->pluck('total', 'date');
        foreach ($dailyOwnerWithdrawals as $date => $total) {
            if (isset($dailyFlow[$date])) $dailyFlow[$date]['expense'] += $total;
        }

        $cumulativeBalance = 0;
        foreach ($dailyFlow as $date => &$flow) {
            $cumulativeBalance += ($flow['income'] - $flow['expense']);
            $flow['balance'] = $cumulativeBalance;
        }
        $data['daily_flow'] = array_values($dailyFlow);

        // --- Branch Operations ---
        foreach ($branches as $branch) {
            $branchSalesQuery = Payment::where('payment_method_id', $cashMethodId)
                ->whereHas('sale', function($q) use ($branch) {
                    $q->where('branch_id', $branch->id);
                });
            if ($startDate && $endDate) {
                $branchSalesQuery->whereBetween('created_at', [$startDate, $endDate]);
            }
            $branchCashSales = $branchSalesQuery->sum('amount');
            
            $branchExpensesQuery = \App\Models\Finance\ExpenseSplit::whereIn('status', ['paid', 'archived'])
                ->where('fund_source', 'cash')
                ->where('deducted_from_wallet', true)
                ->whereHas('expense', function($q) use ($branch) {
                    $q->where('branch_id', $branch->id);
                });
            if ($startDate && $endDate) {
                $branchExpensesQuery->whereBetween('paid_at', [$startDate, $endDate]);
            }
            $branchCashExpenses = $branchExpensesQuery->sum('amount');
                
            $transfersInBranchQuery = CashTransfer::where('status', 'completed')->where('to_branch_id', $branch->id);
            $transfersOutBranchQuery = CashTransfer::where('status', 'completed')->where('from_branch_id', $branch->id);
            
            $movementsInQuery = CashMovement::where('movement_type', 'income')->whereHas('cash_register', function($q) use ($branch) { $q->where('branch_id', $branch->id); });
            $movementsOutQuery = CashMovement::where('movement_type', 'expense')->whereHas('cash_register', function($q) use ($branch) { $q->where('branch_id', $branch->id); });
            
            $ownerCashDepositsQuery = \App\Models\Finance\OwnerPayment::whereIn('status', ['paid', 'archived'])->where('fund_source', 'cash')->where('type', 'deposit')->where('branch_id', $branch->id);
            $ownerCashWithdrawalsQuery = \App\Models\Finance\OwnerPayment::whereIn('status', ['paid', 'archived'])->where('fund_source', 'cash')->where('type', 'withdrawal')->where('branch_id', $branch->id);

            if ($startDate && $endDate) {
                $transfersInBranchQuery->whereBetween('transfer_date', [$startDate, $endDate->format('Y-m-d')]);
                $transfersOutBranchQuery->whereBetween('transfer_date', [$startDate, $endDate->format('Y-m-d')]);
                $movementsInQuery->whereBetween('created_at', [$startDate, $endDate]);
                $movementsOutQuery->whereBetween('created_at', [$startDate, $endDate]);
                $ownerCashDepositsQuery->whereBetween('payment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
                $ownerCashWithdrawalsQuery->whereBetween('payment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
            }
            
            $branchTransfersIn = $transfersInBranchQuery->sum('amount');
            $branchTransfersOut = $transfersOutBranchQuery->sum('amount');
            $movementsIn = $movementsInQuery->sum('amount');
            $movementsOut = $movementsOutQuery->sum('amount');
            $ownerCashDeposits = $ownerCashDepositsQuery->sum('total_amount');
            $ownerCashWithdrawals = $ownerCashWithdrawalsQuery->sum('total_amount');
                
            $cashBalance = $branchCashSales - $branchCashExpenses + $branchTransfersIn - $branchTransfersOut + $movementsIn - $movementsOut + $ownerCashDeposits - $ownerCashWithdrawals;
            
            $data['branches'][] = [
                'id' => $branch->id,
                'name' => $branch->name,
                'cash_sales' => $branchCashSales + $ownerCashDeposits,
                'cash_expenses' => $branchCashExpenses + $ownerCashWithdrawals,
                'transfers_in' => $branchTransfersIn,
                'transfers_out' => $branchTransfersOut,
                'cash_balance' => $cashBalance,
                'is_register_open' => CashRegister::where('branch_id', $branch->id)->where('status', 'open')->exists(),
                'active_register' => CashRegister::where('branch_id', $branch->id)->where('status', 'open')->first()
            ];
            
            $data['summary']['total_cash'] += $cashBalance;
        }

        // --- HISTORIAL UNIFICADO DE CAJAS ---
        $history = collect();

        // 1. Payments (Ingresos por Ventas)
        $payments = Payment::whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_method_id', $cashMethodId)
            ->with(['sale.branch', 'sale.customer.user.profile', 'sale.customer.posProfile', 'sale.guest'])
            ->get()->map(function($p) {
                return [
                    'id' => 'pay_'.$p->id,
                    'date' => $p->created_at,
                    'type' => 'Ingreso (Venta)',
                    'amount' => (float)$p->amount,
                    'branch' => $p->sale->branch->name ?? 'N/A',
                    'description' => 'Venta ' . ($p->sale->invoice_number ?? '#' . substr($p->sale->id, 0, 5)) . ' - ' . ($p->sale->guest->name ?? ($p->sale->customer->posProfile->first_name ?? ($p->sale->customer->user->profile->first_name ?? 'Cliente General'))),
                    'is_positive' => true
                ];
            });
        $history = $history->concat($payments);

        // 2. Expenses (Egresos Operativos via Splits)
        $expenses = \App\Models\Finance\ExpenseSplit::whereBetween('paid_at', [$startDate, $endDate])
            ->where('fund_source', 'cash')
            ->where('deducted_from_wallet', true)
            ->whereIn('status', ['paid', 'archived'])
            ->with(['expense.branch', 'expense.category', 'owner.user.profile'])
            ->get()->map(function($es) {
                $ownerName = $es->owner ? ($es->owner->user->profile->first_name ?? '') : '';
                return [
                    'id' => 'exp_'.$es->id,
                    'date' => $es->paid_at ?? $es->expense->expense_date,
                    'type' => 'Egreso (Gasto)',
                    'amount' => (float)$es->amount,
                    'branch' => $es->expense->branch->name ?? 'N/A',
                    'description' => ($es->expense->category->name ?? 'Gasto') . ' - ' . $es->expense->description . ($ownerName ? " (Cuota de $ownerName)" : ''),
                    'is_positive' => false
                ];
            });
        $history = $history->concat($expenses);

        // 3. Cash Transfers
        $transfers = CashTransfer::whereBetween('transfer_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->where('status', 'completed')
            ->with(['fromBranch', 'toBranch'])
            ->get()->map(function($t) {
                $from = $t->fromBranch ? $t->fromBranch->name : 'Banco';
                $to = $t->toBranch ? $t->toBranch->name : 'Banco';
                return [
                    'id' => 'trans_'.$t->id,
                    'date' => $t->transfer_date,
                    'type' => 'Transferencia',
                    'amount' => (float)$t->amount,
                    'branch' => "$from -> $to",
                    'description' => 'Transferencia de fondos. ' . $t->notes,
                    'is_positive' => null 
                ];
            });
        $history = $history->concat($transfers);

        // 4. Cash Movements (Adjustments/Discrepancies)
        $movements = CashMovement::whereBetween('created_at', [$startDate, $endDate])
            ->with(['cash_register.branch'])
            ->get()->map(function($m) {
                $isIncome = $m->movement_type === 'income';
                return [
                    'id' => 'mov_'.$m->id,
                    'date' => $m->created_at,
                    'type' => $m->reference_type === 'discrepancy' ? 'Arqueo de Caja' : 'Ajuste Extraordinario',
                    'amount' => (float)$m->amount,
                    'branch' => $m->cash_register->branch->name ?? 'N/A',
                    'description' => $m->description,
                    'is_positive' => $isIncome
                ];
            });
        $history = $history->concat($movements);
        
        // 5. Owner Payments (Aportes/Retiros de Socios)
        $ownerPayments = \App\Models\Finance\OwnerPayment::whereBetween('payment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->where('fund_source', 'cash')
            ->whereIn('status', ['paid', 'archived'])
            ->with(['branch', 'owner.user.profile'])
            ->get()->map(function($op) {
                $ownerName = $op->owner ? ($op->owner->user->profile->first_name ?? '') : 'Socio';
                $isDeposit = $op->type === 'deposit';
                return [
                    'id' => 'op_'.$op->id,
                    'date' => $op->payment_date,
                    'type' => $isDeposit ? 'Aporte de Capital' : 'Retiro de Capital',
                    'amount' => (float)$op->total_amount,
                    'branch' => $op->branch->name ?? 'N/A',
                    'description' => ($isDeposit ? 'Depósito de ' : 'Retiro de ') . $ownerName . ' - ' . $op->notes,
                    'is_positive' => $isDeposit
                ];
            });
        $history = $history->concat($ownerPayments);

        // 6. Aperturas y Cierres de Caja
        $registers = CashRegister::whereBetween('opened_at', [$startDate, $endDate])
            ->orWhereBetween('closed_at', [$startDate, $endDate])
            ->with('branch')
            ->get();
            
        foreach ($registers as $reg) {
            if ($reg->opened_at && $reg->opened_at->between($startDate, $endDate)) {
                $history->push([
                    'id' => $reg->id . '_open',
                    'date' => $reg->opened_at,
                    'type' => 'Apertura de Caja',
                    'amount' => (float)$reg->opening_amount,
                    'branch' => $reg->branch->name ?? 'N/A',
                    'description' => 'Monto inicial con el que inició operaciones la caja.',
                    'is_positive' => null
                ]);
            }
            if ($reg->closed_at && $reg->closed_at->between($startDate, $endDate)) {
                $history->push([
                    'id' => $reg->id . '_close',
                    'date' => $reg->closed_at,
                    'type' => 'Cierre de Caja',
                    'amount' => (float)$reg->closing_amount,
                    'branch' => $reg->branch->name ?? 'N/A',
                    'description' => 'Monto físico total declarado al cerrar turno.',
                    'is_positive' => null
                ]);
            }
        }

        $data['history'] = $history->sortByDesc('date')->values()->all();

        return response()->json($data);
    }

    public function transfer(Request $request)
    {
        $request->validate([
            'from_type' => 'required|in:branch,bank',
            'from_branch_id' => 'required_if:from_type,branch|nullable|uuid|exists:branches,id',
            'to_type' => 'required|in:branch,bank',
            'to_branch_id' => 'required_if:to_type,branch|nullable|uuid|exists:branches,id',
            'amount' => 'required|numeric|min:0.01',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string'
        ]);

        if ($request->from_type === 'bank' && $request->to_type === 'bank') {
            return response()->json(['error' => 'No se puede transferir de banco a banco'], 400);
        }

        if ($request->from_type === 'branch' && $request->to_type === 'branch' && $request->from_branch_id === $request->to_branch_id) {
            return response()->json(['error' => 'No se puede transferir a la misma sucursal'], 400);
        }

        $transfer = CashTransfer::create([
            'from_branch_id' => $request->from_type === 'branch' ? $request->from_branch_id : null,
            'to_branch_id' => $request->to_type === 'branch' ? $request->to_branch_id : null,
            'amount' => $request->amount,
            'transfer_date' => $request->transfer_date,
            'notes' => $request->notes,
            'created_by' => auth()->id(),
            'status' => 'completed'
        ]);

        return response()->json($transfer, 201);
    }

    public function openRegister(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|uuid|exists:branches,id',
            'opening_amount' => 'required|numeric|min:0'
        ]);

        $exists = CashRegister::where('branch_id', $request->branch_id)->where('status', 'open')->exists();
        if ($exists) {
            return response()->json(['error' => 'Ya existe una caja abierta en esta sucursal.'], 400);
        }

        $employeeId = auth()->user()->employee ? auth()->user()->employee->id : null;

        $register = CashRegister::create([
            'branch_id' => $request->branch_id,
            'employee_id' => $employeeId,
            'opening_amount' => $request->opening_amount,
            'opened_at' => now(),
            'status' => 'open'
        ]);

        return response()->json($register, 201);
    }

    public function closeRegister(Request $request)
    {
        $request->validate([
            'register_id' => 'required|uuid|exists:cash_registers,id',
            'closing_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        $register = CashRegister::where('id', $request->register_id)->where('status', 'open')->firstOrFail();
        
        $register->update([
            'closing_amount' => $request->closing_amount,
            'closed_at' => now(),
            'status' => 'closed'
        ]);

        // Register discrepancy if needed
        $expected = $request->expected_amount ?? $register->opening_amount; // Ideally we calculate real expected, but UI will pass it if needed.
        if ($request->has('expected_amount') && $request->closing_amount != $request->expected_amount) {
            $diff = $request->closing_amount - $request->expected_amount;
            CashMovement::create([
                'cash_register_id' => $register->id,
                'movement_type' => $diff > 0 ? 'income' : 'expense',
                'amount' => abs($diff),
                'reference_type' => 'discrepancy',
                'description' => ($diff > 0 ? 'Sobrante' : 'Faltante') . ' de caja detectado al cerrar. Notas: ' . $request->notes
            ]);
        }

        return response()->json($register);
    }

    public function addAdjustment(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|uuid|exists:branches,id',
            'type' => 'required|in:in,out,income,expense',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string'
        ]);

        $typeMap = ['in' => 'income', 'out' => 'expense', 'income' => 'income', 'expense' => 'expense'];
        
        $register = CashRegister::where('branch_id', $request->branch_id)->where('status', 'open')->first();
        $registerId = $register ? $register->id : null;

        $movement = CashMovement::create([
            'cash_register_id' => $registerId,
            'movement_type' => $typeMap[$request->type],
            'amount' => $request->amount,
            'reference_type' => 'adjustment',
            'description' => 'Ajuste de Tesorería: ' . $request->description
        ]);

        // To make the adjustment reflect in cash_balance without changing past logic deeply, 
        // we will create a dummy expense or payment just for balancing, OR we modify CashFlowController to include CashMovements.
        // For now, if we want it to reflect instantly in pure cash, we should include it in the `branchCashExpenses` or `branchCashSales` or a new metric `branchCashAdjustments`.
        
        return response()->json($movement, 201);
    }
}
