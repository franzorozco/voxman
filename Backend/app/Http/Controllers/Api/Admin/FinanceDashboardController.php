<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Actors\Owner;
use App\Models\Sales\SaleDetail;
use App\Models\Finance\OwnerPayment;
use App\Models\Finance\ExpenseSplit;
use App\Models\Finance\Expense;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentMethod;
use App\Models\Branch\Branch;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinanceDashboardController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        if ($startDate && $endDate) {
            $startDate = \Carbon\Carbon::parse($startDate)->startOfDay();
            $endDate = \Carbon\Carbon::parse($endDate)->endOfDay();
        }

        $branchIdFilter = $request->query('branch_id', 'all');
        $owners = Owner::with('user.profile')->where('is_active', true)->get();
        $allBranches = Branch::where('is_active', true)->get();
        
        $data = [];
        
        // TREASURY LOGIC FIRST
        $cashMethod = PaymentMethod::where('name', 'Efectivo')->first();
        $cashMethodId = $cashMethod ? $cashMethod->id : null;
        $giftcardMethodIds = PaymentMethod::where('name', 'ILIKE', '%giftcard%')->pluck('id')->toArray();

        $expensesQuery = Expense::whereIn('status', ['paid', 'archived']);
        if ($branchIdFilter !== 'all') {
            $expensesQuery->where('branch_id', $branchIdFilter);
        }
        $totalStoreExpenses = $expensesQuery->sum('amount');
        
        $globalSalesQuery = SaleDetail::with('sale.payments')
            ->whereHas('sale', function($q) use ($branchIdFilter, $startDate, $endDate) {
                $q->where('status', 'paid');
                if ($branchIdFilter !== 'all') {
                    $q->where('branch_id', $branchIdFilter);
                }
                if ($startDate && $endDate) {
                    $q->whereBetween('created_at', [$startDate, $endDate]);
                }
            });
        
        $globalSalesDetails = $globalSalesQuery->get();
        
        $cashSales = 0;
        $bankSales = 0;
        $giftcardSales = 0;

        foreach ($globalSalesDetails as $detail) {
            $detailTotal = $detail->subtotal - $detail->discount;
            $sale = $detail->sale;
            $saleTotal = $sale->total;
            
            if ($saleTotal > 0 && $sale->payments->count() > 0) {
                $saleCash = 0;
                $saleGiftcard = 0;
                $saleBank = 0;
                
                foreach ($sale->payments as $p) {
                    if ($p->payment_method_id === $cashMethodId) {
                        $saleCash += $p->amount;
                    } elseif (in_array($p->payment_method_id, $giftcardMethodIds)) {
                        $saleGiftcard += $p->amount;
                    } else {
                        $saleBank += $p->amount;
                    }
                }
                
                $cashRatio = $saleCash / $saleTotal;
                $giftcardRatio = $saleGiftcard / $saleTotal;
                $bankRatio = 1 - $cashRatio - $giftcardRatio;
                
                $cashSales += ($detailTotal * $cashRatio);
                $giftcardSales += ($detailTotal * $giftcardRatio);
                $bankSales += ($detailTotal * $bankRatio);
            } else {
                $bankSales += $detailTotal;
            }
        }

        $cashExpensesQuery = Expense::whereIn('status', ['paid', 'archived'])->where('fund_source', 'cash');
        $bankExpensesQuery = Expense::whereIn('status', ['paid', 'archived'])->where('fund_source', 'bank');
        if ($branchIdFilter !== 'all') {
            $cashExpensesQuery->where('branch_id', $branchIdFilter);
            $bankExpensesQuery->where('branch_id', $branchIdFilter);
        }
        $cashExpenses = $cashExpensesQuery->sum('amount');
        $bankExpenses = $bankExpensesQuery->sum('amount');

        $cashDepositsQuery = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('type', 'deposit')->where('fund_source', 'cash');
        $bankDepositsQuery = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('type', 'deposit')->where('fund_source', 'bank');
        if ($branchIdFilter !== 'all') {
            $cashDepositsQuery->where('branch_id', $branchIdFilter);
            $bankDepositsQuery->where('branch_id', $branchIdFilter);
        }
        $cashDeposits = $cashDepositsQuery->sum('total_amount');
        $bankDeposits = $bankDepositsQuery->sum('total_amount');

        $cashWithdrawalsQuery = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('type', 'withdrawal')->where('fund_source', 'cash');
        $bankWithdrawalsQuery = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('type', 'withdrawal')->where('fund_source', 'bank');
        if ($branchIdFilter !== 'all') {
            $cashWithdrawalsQuery->where('branch_id', $branchIdFilter);
            $bankWithdrawalsQuery->where('branch_id', $branchIdFilter);
        }
        $cashWithdrawals = $cashWithdrawalsQuery->sum('total_amount');
        $bankWithdrawals = $bankWithdrawalsQuery->sum('total_amount');

        $totalStoreRevenue = $cashSales + $bankSales + $giftcardSales;

        // CALCULAR BALANCE POR SOCIO Y SUCURSAL
        $data['owners'] = [];
        foreach ($owners as $owner) {
            $ownerTotalRevenue = 0;
            $ownerTotalExpenses = 0;
            $ownerTotalPendingDebts = 0;
            $ownerTotalWithdrawals = 0;
            $ownerTotalDeposits = 0;
            $ownerTotalCashBalance = 0;
            $ownerTotalBankBalance = 0;

            $ownerBranches = [];

            // We calculate per branch
            foreach ($allBranches as $branch) {
                // Sales
                $salesQuery = SaleDetail::with('sale.payments')
                    ->whereHas('sale', function($q) use ($branch, $startDate, $endDate) {
                        $q->where('status', 'paid')->where('branch_id', $branch->id);
                        if ($startDate && $endDate) {
                            $q->whereBetween('created_at', [$startDate, $endDate]);
                        }
                    })
                    ->where('owner_id', $owner->id);
                $salesDetails = $salesQuery->get();
                
                $branchCashSales = 0;
                $branchBankSales = 0;
                $branchSalesRevenue = 0;

                foreach ($salesDetails as $detail) {
                    $detailTotal = $detail->subtotal - $detail->discount;
                    $branchSalesRevenue += $detailTotal;
                    
                    $sale = $detail->sale;
                    $saleTotal = $sale->total;
                    
                    if ($saleTotal > 0 && $sale->payments->count() > 0) {
                        $saleCash = 0;
                        $saleBank = 0;
                        foreach ($sale->payments as $p) {
                            if ($p->payment_method_id === $cashMethodId) {
                                $saleCash += $p->amount;
                            } else {
                                $saleBank += $p->amount;
                            }
                        }
                        $cashRatio = $saleCash / $saleTotal;
                        $bankRatio = 1 - $cashRatio;
                        
                        $branchCashSales += ($detailTotal * $cashRatio);
                        $branchBankSales += ($detailTotal * $bankRatio);
                    } else {
                        $branchBankSales += $detailTotal;
                    }
                }

                // Expenses
                $expensesCashQuery = ExpenseSplit::where('owner_id', $owner->id)
                    ->whereHas('expense', function($q) use ($branch) {
                        $q->where('branch_id', $branch->id);
                    })
                    ->whereIn('status', ['paid', 'archived'])
                    ->where('deducted_from_wallet', true)
                    ->where('fund_source', 'cash');
                    
                $expensesBankQuery = ExpenseSplit::where('owner_id', $owner->id)
                    ->whereHas('expense', function($q) use ($branch) {
                        $q->where('branch_id', $branch->id);
                    })
                    ->whereIn('status', ['paid', 'archived'])
                    ->where('deducted_from_wallet', true)
                    ->where('fund_source', 'bank');
                    
                $expensesLegacyQuery = ExpenseSplit::where('owner_id', $owner->id)
                    ->whereHas('expense', function($q) use ($branch) {
                        $q->where('branch_id', $branch->id);
                    })
                    ->whereIn('status', ['paid', 'archived'])
                    ->where('deducted_from_wallet', true)
                    ->whereNull('fund_source');

                $pendingDebtsQuery = ExpenseSplit::where('owner_id', $owner->id)
                    ->whereHas('expense', function($q) use ($branch) {
                        $q->where('branch_id', $branch->id);
                    })
                    ->where('status', 'pending');

                if ($startDate && $endDate) {
                    $expensesCashQuery->where(function($q) use ($startDate, $endDate) {
                        $q->whereBetween('paid_at', [$startDate, $endDate])->orWhereBetween('created_at', [$startDate, $endDate]);
                    });
                    $expensesBankQuery->where(function($q) use ($startDate, $endDate) {
                        $q->whereBetween('paid_at', [$startDate, $endDate])->orWhereBetween('created_at', [$startDate, $endDate]);
                    });
                    $expensesLegacyQuery->where(function($q) use ($startDate, $endDate) {
                        $q->whereBetween('paid_at', [$startDate, $endDate])->orWhereBetween('created_at', [$startDate, $endDate]);
                    });
                    $pendingDebtsQuery->whereHas('expense', function($q) use ($startDate, $endDate) {
                        $q->whereBetween('expense_date', [$startDate, $endDate]);
                    });
                }

                $expensesCash = $expensesCashQuery->sum('amount');
                $expensesBank = $expensesBankQuery->sum('amount');
                $expensesLegacy = $expensesLegacyQuery->sum('amount');
                $pendingDebts = $pendingDebtsQuery->sum('amount');
                $expensesCash += $expensesLegacy;
                $branchExpensesAssumed = $expensesCash + $expensesBank;

                // Withdrawals / Deposits
                $withdrawalsCashQuery = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'withdrawal')->where('fund_source', 'cash')->where('branch_id', $branch->id);
                $withdrawalsBankQuery = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'withdrawal')->where('fund_source', 'bank')->where('branch_id', $branch->id);
                $depositsCashQuery = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'deposit')->where('fund_source', 'cash')->where('branch_id', $branch->id);
                $depositsBankQuery = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'deposit')->where('fund_source', 'bank')->where('branch_id', $branch->id);

                if ($startDate && $endDate) {
                    $withdrawalsCashQuery->whereBetween('created_at', [$startDate, $endDate]);
                    $withdrawalsBankQuery->whereBetween('created_at', [$startDate, $endDate]);
                    $depositsCashQuery->whereBetween('created_at', [$startDate, $endDate]);
                    $depositsBankQuery->whereBetween('created_at', [$startDate, $endDate]);
                }

                $withdrawalsCash = $withdrawalsCashQuery->sum('total_amount');
                $withdrawalsBank = $withdrawalsBankQuery->sum('total_amount');
                $branchWithdrawals = $withdrawalsCash + $withdrawalsBank;
                
                $depositsCash = $depositsCashQuery->sum('total_amount');
                $depositsBank = $depositsBankQuery->sum('total_amount');
                $branchDeposits = $depositsCash + $depositsBank;

                // Branch Balances
                $branchCashBalance = $branchCashSales - $expensesCash - $withdrawalsCash + $depositsCash;
                $branchBankBalance = $branchBankSales - $expensesBank - $withdrawalsBank + $depositsBank;
                $branchCurrentBalance = $branchCashBalance + $branchBankBalance;

                $ownerBranches[] = [
                    'branch_id' => $branch->id,
                    'branch_name' => $branch->name,
                    'sales_revenue' => $branchSalesRevenue,
                    'expenses_assumed' => $branchExpensesAssumed,
                    'pending_debts' => $pendingDebts,
                    'withdrawals' => $branchWithdrawals,
                    'deposits' => $branchDeposits,
                    'cash_balance' => $branchCashBalance,
                    'bank_balance' => $branchBankBalance,
                    'current_balance' => $branchCurrentBalance
                ];

                $ownerTotalRevenue += $branchSalesRevenue;
                $ownerTotalExpenses += $branchExpensesAssumed;
                $ownerTotalPendingDebts += $pendingDebts;
                $ownerTotalWithdrawals += $branchWithdrawals;
                $ownerTotalDeposits += $branchDeposits;
                $ownerTotalCashBalance += $branchCashBalance;
                $ownerTotalBankBalance += $branchBankBalance;
            }

            // Legacy payments with no branch
            $withdrawalsCashGlobal = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'withdrawal')->where('fund_source', 'cash')->whereNull('branch_id')->sum('total_amount');
            $withdrawalsBankGlobal = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'withdrawal')->where('fund_source', 'bank')->whereNull('branch_id')->sum('total_amount');
            $depositsCashGlobal = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'deposit')->where('fund_source', 'cash')->whereNull('branch_id')->sum('total_amount');
            $depositsBankGlobal = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'deposit')->where('fund_source', 'bank')->whereNull('branch_id')->sum('total_amount');
            
            $ownerTotalWithdrawals += $withdrawalsCashGlobal + $withdrawalsBankGlobal;
            $ownerTotalDeposits += $depositsCashGlobal + $depositsBankGlobal;
            $ownerTotalCashBalance = $ownerTotalCashBalance - $withdrawalsCashGlobal + $depositsCashGlobal;
            $ownerTotalBankBalance = $ownerTotalBankBalance - $withdrawalsBankGlobal + $depositsBankGlobal;

            // Add an "Unassigned" branch if legacy payments exist
            if ($withdrawalsCashGlobal > 0 || $withdrawalsBankGlobal > 0 || $depositsCashGlobal > 0 || $depositsBankGlobal > 0) {
                $ownerBranches[] = [
                    'branch_id' => null,
                    'branch_name' => 'Sin Sucursal (Legado)',
                    'sales_revenue' => 0,
                    'expenses_assumed' => 0,
                    'pending_debts' => 0,
                    'withdrawals' => $withdrawalsCashGlobal + $withdrawalsBankGlobal,
                    'deposits' => $depositsCashGlobal + $depositsBankGlobal,
                    'cash_balance' => -$withdrawalsCashGlobal + $depositsCashGlobal,
                    'bank_balance' => -$withdrawalsBankGlobal + $depositsBankGlobal,
                    'current_balance' => (-$withdrawalsCashGlobal + $depositsCashGlobal) + (-$withdrawalsBankGlobal + $depositsBankGlobal)
                ];
            }

            $data['owners'][] = [
                'owner_id' => $owner->id,
                'user_id' => $owner->user_id,
                'name' => $owner->user->profile->first_name . ' ' . $owner->user->profile->last_name,
                'sales_revenue' => $ownerTotalRevenue,
                'expenses_assumed' => $ownerTotalExpenses,
                'pending_debts' => $ownerTotalPendingDebts,
                'withdrawals' => $ownerTotalWithdrawals,
                'deposits' => $ownerTotalDeposits,
                'cash_balance' => $ownerTotalCashBalance,
                'bank_balance' => $ownerTotalBankBalance,
                'current_balance' => $ownerTotalCashBalance + $ownerTotalBankBalance,
                'branches' => $ownerBranches
            ];
        }

        $treasury = [
            'cash_balance' => $cashSales + $cashDeposits - $cashExpenses - $cashWithdrawals,
            'bank_balance' => $bankSales + $bankDeposits - $bankExpenses - $bankWithdrawals,
            'details' => [
                'cash' => [
                    'sales' => $cashSales,
                    'deposits' => $cashDeposits,
                    'expenses' => $cashExpenses,
                    'withdrawals' => $cashWithdrawals
                ],
                'bank' => [
                    'sales' => $bankSales,
                    'deposits' => $bankDeposits,
                    'expenses' => $bankExpenses,
                    'withdrawals' => $bankWithdrawals
                ],
                'giftcard' => [
                    'sales' => $giftcardSales
                ]
            ]
        ];

        $data['summary'] = [
            'total_revenue' => $totalStoreRevenue,
            'total_expenses' => $totalStoreExpenses,
            'net_profit' => $totalStoreRevenue - $totalStoreExpenses,
            'treasury' => $treasury
        ];

        return response()->json($data);
    }

    public function ownerLedger(Request $request, $id)
    {
        $owner = Owner::findOrFail($id);
        
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        if ($startDate && $endDate) {
            $startDate = Carbon::parse($startDate)->startOfDay();
            $endDate = Carbon::parse($endDate)->endOfDay();
        }

        $ledger = [];

        // 1. Sales
        $salesQuery = SaleDetail::with(['sale.payments', 'sale.branch', 'sale.shipments'])->whereHas('sale', function($q) use ($startDate, $endDate) {
            $q->where('status', 'paid');
            if ($startDate && $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            }
        })->where('owner_id', $owner->id);
        $sales = $salesQuery->get();

        $cashMethod = PaymentMethod::where('name', 'Efectivo')->first();
        $cashMethodId = $cashMethod ? $cashMethod->id : null;

        foreach ($sales as $saleDetail) {
            $detailTotal = $saleDetail->subtotal - $saleDetail->discount;
            $sale = $saleDetail->sale;
            $saleTotal = $sale->total;
            $branchName = $sale->branch ? $sale->branch->name : 'N/A';

            $fundStr = 'Banco';
            if ($saleTotal > 0 && $sale->payments->count() > 0) {
                $saleCash = 0;
                foreach ($sale->payments as $p) {
                    if ($p->payment_method_id === $cashMethodId) {
                        $saleCash += $p->amount;
                    }
                }
                $cashRatio = $saleCash / $saleTotal;
                if ($cashRatio > 0.5) {
                    $fundStr = 'Caja';
                } elseif ($cashRatio > 0) {
                    $fundStr = 'Caja/Banco';
                }
            }

            $deliveryType = '';
            $shipment = $sale->shipments->first();
            if ($shipment) {
                if ($shipment->delivery_type === 'home_delivery') $deliveryType = ' [Delivery]';
                elseif ($shipment->delivery_type === 'external') $deliveryType = ' [Envío Nacional]';
                elseif ($shipment->delivery_type === 'scheduled_point') $deliveryType = ' [Entrega en Punto]';
            }

            $ledger[] = [
                'date' => Carbon::parse($sale->created_at)->toIso8601String(),
                'branch_name' => $branchName,
                'description' => 'Ingreso por venta (' . $fundStr . ')' . $deliveryType . ': ' . $saleDetail->product_name,
                'type' => 'sale',
                'amount' => $detailTotal
            ];
        }

        // 2. Expenses Assumed
        $expensesQuery = ExpenseSplit::with('expense.branch')
                                ->whereIn('status', ['paid', 'archived'])
                                ->where('deducted_from_wallet', true)
                                ->where('owner_id', $owner->id);
                                
        if ($startDate && $endDate) {
            $expensesQuery->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('paid_at', [$startDate, $endDate])
                  ->orWhereBetween('created_at', [$startDate, $endDate]);
            });
        }
        $expenses = $expensesQuery->get();

        foreach ($expenses as $expenseSplit) {
            $branchName = $expenseSplit->expense && $expenseSplit->expense->branch ? $expenseSplit->expense->branch->name : 'N/A';
            $ledger[] = [
                'date' => $expenseSplit->paid_at ? Carbon::parse($expenseSplit->paid_at)->toIso8601String() : Carbon::parse($expenseSplit->created_at)->toIso8601String(),
                'branch_name' => $branchName,
                'description' => 'Gasto asumido (' . ($expenseSplit->fund_source === 'bank' ? 'Banco' : 'Caja') . '): ' . $expenseSplit->expense->name,
                'type' => 'expense',
                'amount' => -$expenseSplit->amount
            ];
        }

        // 3. Owner Payments (Deposits / Withdrawals)
        $paymentsQuery = OwnerPayment::with('branch')->whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id);
        if ($startDate && $endDate) {
            $paymentsQuery->whereBetween('created_at', [$startDate, $endDate]);
        }
        $payments = $paymentsQuery->get();

        foreach ($payments as $payment) {
            $isDeposit = $payment->type === 'deposit';
            $fundLabel = $payment->fund_source === 'bank' ? 'Banco' : 'Caja';
            $branchName = $payment->branch ? $payment->branch->name : 'Global/Legado';
            $ledger[] = [
                'date' => Carbon::parse($payment->created_at)->toIso8601String(),
                'branch_name' => $branchName,
                'description' => ($isDeposit ? 'Inyección de capital (' : 'Retiro de capital (') . $fundLabel . ')',
                'type' => $payment->type,
                'amount' => $isDeposit ? $payment->total_amount : -$payment->total_amount
            ];
        }

        // Sort chronologically
        usort($ledger, function($a, $b) {
            return strtotime($a['date']) - strtotime($b['date']);
        });

        // Calculate running balance
        $runningBalance = 0;
        foreach ($ledger as &$transaction) {
            $transaction['previous_balance'] = $runningBalance;
            $runningBalance += $transaction['amount'];
            $transaction['new_balance'] = $runningBalance;
            // Format dates for frontend
            $transaction['date'] = Carbon::parse($transaction['date'])->toIso8601String();
        }

        return response()->json(array_reverse($ledger));
    }
}
