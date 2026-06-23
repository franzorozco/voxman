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
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinanceDashboardController extends Controller
{
    public function index(Request $request)
    {
        $owners = Owner::with('user.profile')->where('is_active', true)->get();
        
        $data = [];
        
        $totalStoreRevenue = 0;
        $totalStoreExpenses = Expense::whereIn('status', ['paid', 'archived'])->sum('amount');
        
        // TREASURY LOGIC FIRST
        $cashMethod = PaymentMethod::where('name', 'Efectivo')->first();
        $cashMethodId = $cashMethod ? $cashMethod->id : null;
        $giftcardMethodIds = PaymentMethod::where('name', 'ILIKE', '%giftcard%')->pluck('id')->toArray();

        $cashSales = 0;
        $bankSales = 0;
        $giftcardSales = 0;

        if ($cashMethodId) {
            $cashSales = Payment::where('payment_method_id', $cashMethodId)->sum('amount');
            
            $bankQuery = Payment::where('payment_method_id', '!=', $cashMethodId);
            if (!empty($giftcardMethodIds)) {
                $bankQuery->whereNotIn('payment_method_id', $giftcardMethodIds);
                $giftcardSales = Payment::whereIn('payment_method_id', $giftcardMethodIds)->sum('amount');
            }
            $bankSales = $bankQuery->sum('amount');
        } else {
            $bankSales = Payment::sum('amount');
        }

        $cashExpenses = Expense::whereIn('status', ['paid', 'archived'])->where('fund_source', 'cash')->sum('amount');
        $bankExpenses = Expense::whereIn('status', ['paid', 'archived'])->where('fund_source', 'bank')->sum('amount');

        $cashDeposits = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('type', 'deposit')->where('fund_source', 'cash')->sum('total_amount');
        $bankDeposits = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('type', 'deposit')->where('fund_source', 'bank')->sum('total_amount');

        $cashWithdrawals = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('type', 'withdrawal')->where('fund_source', 'cash')->sum('total_amount');
        $bankWithdrawals = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('type', 'withdrawal')->where('fund_source', 'bank')->sum('total_amount');

        // CALCULAR BALANCE POR SOCIO
        foreach ($owners as $owner) {
            $salesDetails = SaleDetail::with('sale.payments')
                ->whereHas('sale', function($q) {
                    $q->where('status', 'paid');
                })
                ->where('owner_id', $owner->id)
                ->get();
            
            $ownerCashSales = 0;
            $ownerBankSales = 0;
            $salesRevenue = 0;

            foreach ($salesDetails as $detail) {
                $detailTotal = $detail->subtotal - $detail->discount;
                $salesRevenue += $detailTotal;
                
                $sale = $detail->sale;
                $saleTotal = $sale->total;
                
                if ($saleTotal > 0 && $sale->payments->count() > 0) {
                    $saleCash = 0;
                    $saleBank = 0;
                    foreach ($sale->payments as $p) {
                        if ($p->payment_method_id === $cashMethodId) {
                            $saleCash += $p->amount;
                        } else {
                            $saleBank += $p->amount; // Giftcards treated as bank/digital for owner balance
                        }
                    }
                    $cashRatio = $saleCash / $saleTotal;
                    $bankRatio = 1 - $cashRatio;
                    
                    $ownerCashSales += ($detailTotal * $cashRatio);
                    $ownerBankSales += ($detailTotal * $bankRatio);
                } else {
                    $ownerBankSales += $detailTotal; // Default to bank if no payments found
                }
            }
            
            $expensesCash = ExpenseSplit::where('owner_id', $owner->id)
                ->whereIn('status', ['paid', 'archived'])
                ->where('deducted_from_wallet', true)
                ->where('fund_source', 'cash')
                ->sum('amount');
                
            $expensesBank = ExpenseSplit::where('owner_id', $owner->id)
                ->whereIn('status', ['paid', 'archived'])
                ->where('deducted_from_wallet', true)
                ->where('fund_source', 'bank')
                ->sum('amount');
                
            // Compatibilidad hacia atrás (si fund_source es nulo en splits viejos, caen a cash por defecto)
            $expensesLegacy = ExpenseSplit::where('owner_id', $owner->id)
                ->whereIn('status', ['paid', 'archived'])
                ->where('deducted_from_wallet', true)
                ->whereNull('fund_source')
                ->sum('amount');
            $expensesCash += $expensesLegacy;

            $expensesAssumed = $expensesCash + $expensesBank;
            
            $withdrawalsCash = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'withdrawal')->where('fund_source', 'cash')->sum('total_amount');
            $withdrawalsBank = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'withdrawal')->where('fund_source', 'bank')->sum('total_amount');
            $withdrawals = $withdrawalsCash + $withdrawalsBank;
            
            $depositsCash = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'deposit')->where('fund_source', 'cash')->sum('total_amount');
            $depositsBank = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->where('type', 'deposit')->where('fund_source', 'bank')->sum('total_amount');
            $deposits = $depositsCash + $depositsBank;
            
            $cashBalance = $ownerCashSales - $expensesCash - $withdrawalsCash + $depositsCash;
            $bankBalance = $ownerBankSales - $expensesBank - $withdrawalsBank + $depositsBank;
            $currentBalance = $cashBalance + $bankBalance;
            
            $data['owners'][] = [
                'owner_id' => $owner->id,
                'user_id' => $owner->user_id,
                'name' => $owner->user->profile->first_name . ' ' . $owner->user->profile->last_name,
                'sales_revenue' => $salesRevenue,
                'expenses_assumed' => $expensesAssumed,
                'withdrawals' => $withdrawals,
                'deposits' => $deposits,
                'cash_balance' => $cashBalance,
                'bank_balance' => $bankBalance,
                'current_balance' => $currentBalance
            ];
            
            $totalStoreRevenue += $salesRevenue;
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

    public function ownerLedger($id)
    {
        $owner = Owner::findOrFail($id);
        
        $ledger = [];

        // 1. Sales
        $sales = SaleDetail::with('sale.payments')->whereHas('sale', function($q) {
            $q->where('status', 'paid');
        })->where('owner_id', $owner->id)->get();

        $cashMethod = PaymentMethod::where('name', 'Efectivo')->first();
        $cashMethodId = $cashMethod ? $cashMethod->id : null;

        foreach ($sales as $saleDetail) {
            $detailTotal = $saleDetail->subtotal - $saleDetail->discount;
            $sale = $saleDetail->sale;
            $saleTotal = $sale->total;

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

            $ledger[] = [
                'date' => Carbon::parse($sale->created_at)->toIso8601String(),
                'description' => 'Ingreso por venta (' . $fundStr . '): ' . $saleDetail->product_name,
                'type' => 'sale',
                'amount' => $detailTotal
            ];
        }

        // 2. Expenses Assumed
        $expenses = ExpenseSplit::with('expense')
                                ->whereIn('status', ['paid', 'archived'])
                                ->where('deducted_from_wallet', true)
                                ->where('owner_id', $owner->id)->get();

        foreach ($expenses as $expenseSplit) {
            $ledger[] = [
                'date' => $expenseSplit->paid_at ? Carbon::parse($expenseSplit->paid_at)->toIso8601String() : Carbon::parse($expenseSplit->created_at)->toIso8601String(),
                'description' => 'Gasto asumido (' . ($expenseSplit->fund_source === 'bank' ? 'Banco' : 'Caja') . '): ' . $expenseSplit->expense->name,
                'type' => 'expense',
                'amount' => -$expenseSplit->amount
            ];
        }

        // 3. Owner Payments (Deposits / Withdrawals)
        $payments = OwnerPayment::whereIn('status', ['paid', 'archived'])->where('owner_id', $owner->id)->get();

        foreach ($payments as $payment) {
            $isDeposit = $payment->type === 'deposit';
            $fundLabel = $payment->fund_source === 'bank' ? 'Banco' : 'Caja';
            $ledger[] = [
                'date' => Carbon::parse($payment->created_at)->toIso8601String(),
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
