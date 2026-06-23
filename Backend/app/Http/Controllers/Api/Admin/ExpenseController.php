<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Finance\Expense;
use App\Models\Finance\ExpenseSplit;
use App\Models\Actors\Owner;
use App\Models\Sales\SaleDetail;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ExpenseController extends Controller
{
    public function index()
    {
        $this->processRecurringExpenses();
        $expenses = Expense::with(['expense_splits.owner.user.profile', 'branch'])->orderBy('expense_date', 'desc')->get();
        return response()->json($expenses);
    }

    public function store(Request $request)
    {
        $request->validate([
            'branch_id' => 'nullable|uuid',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'category' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
            'split_type' => 'required|in:equal,proportional,custom,single_owner',
            'is_recurring' => 'boolean',
            'recurrence_interval' => 'nullable|string|in:monthly,weekly,yearly',
            'fund_source' => 'nullable|string|in:cash,bank',
            'deducted_from_wallet' => 'boolean',
            // For custom
            'splits' => 'required_if:split_type,custom|array',
            'splits.*.owner_id' => 'required_with:splits|uuid',
            'splits.*.amount' => 'required_with:splits|numeric|min:0',
            // For single_owner
            'owner_id' => 'required_if:split_type,single_owner|uuid'
        ]);

        if ($request->status === 'paid' && $request->fund_source) {
            $balance = $this->getTreasuryBalance($request->fund_source);
            $amountToDeduct = $request->amount;
            if ($balance < $amountToDeduct) {
                $sourceName = $request->fund_source === 'cash' ? 'Caja Física' : 'Cuenta Bancaria';
                return response()->json(['error' => "Saldo insuficiente en $sourceName. Saldo disponible: Bs. " . number_format($balance, 2)], 400);
            }
        }

        DB::beginTransaction();
        try {
            $expense = Expense::create($request->only([
                'branch_id', 'name', 'description', 'amount', 'expense_date', 'category', 'status', 'split_type', 'is_recurring', 'recurrence_interval', 'fund_source', 'deducted_from_wallet'
            ]));

            $this->applySplits($expense, $request);

            DB::commit();
            return response()->json($expense->load('expense_splits.owner.user.profile'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $expense = Expense::with('expense_splits.owner.user.profile')->findOrFail($id);
        return response()->json($expense);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:150',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'split_type' => 'required|in:equal,proportional,custom,single_owner',
            'is_recurring' => 'boolean',
            'recurrence_interval' => 'nullable|string|in:monthly,weekly,yearly',
            'fund_source' => 'nullable|string|in:cash,bank',
            'deducted_from_wallet' => 'boolean'
        ]);

        $expense = Expense::findOrFail($id);

        $oldStatus = $expense->status;

        if ($request->status === 'paid' && $request->fund_source) {
            $balance = $this->getTreasuryBalance($request->fund_source);
            $amountToDeduct = $request->amount;
            if ($oldStatus === 'paid' && $expense->fund_source === $request->fund_source) {
                $balance += $expense->amount; 
            }
            if ($balance < $amountToDeduct) {
                $sourceName = $request->fund_source === 'cash' ? 'Caja Física' : 'Cuenta Bancaria';
                return response()->json(['error' => "Saldo insuficiente en $sourceName. Saldo disponible: Bs. " . number_format($balance, 2)], 400);
            }
        }

        DB::beginTransaction();
        try {
            $expense->update($request->only([
                'branch_id', 'name', 'description', 'amount', 'expense_date', 'category', 'status', 'split_type', 'is_recurring', 'recurrence_interval', 'fund_source', 'deducted_from_wallet'
            ]));

            // Remove old splits
            ExpenseSplit::where('expense_id', $expense->id)->delete();
            
            // Apply new splits
            $this->applySplits($expense, $request);

            DB::commit();
            return response()->json($expense->load('expense_splits.owner.user.profile'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $expense = Expense::findOrFail($id);
        
        DB::beginTransaction();
        try {
            $expense->delete(); // Automatically deletes splits via ON DELETE CASCADE
            DB::commit();
            return response()->json(['message' => 'Expense deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function archive($id)
    {
        $expense = Expense::findOrFail($id);
        DB::beginTransaction();
        try {
            $expense->status = 'archived';
            $expense->save();
            
            foreach ($expense->expense_splits as $split) {
                if ($split->status === 'paid') {
                    $split->status = 'archived';
                    $split->save();
                }
            }
            DB::commit();
            return response()->json(['message' => 'Gasto archivado. Ya no aparecerá en la lista principal pero sigue en el Kardex y contabilidad.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function annul($id)
    {
        $expense = Expense::findOrFail($id);
        DB::beginTransaction();
        try {
            $expense->status = 'annulled';
            $expense->save();
            
            foreach ($expense->expense_splits as $split) {
                if ($split->status === 'paid') {
                    $split->status = 'annulled';
                    $split->save();
                }
            }
            DB::commit();
            return response()->json(['message' => 'Gasto anulado. El dinero ha sido reintegrado a la tesorería.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }


    public function paySplit(Request $request, $id)
    {
        $request->validate([
            'deducted_from_wallet' => 'boolean',
            'fund_source' => 'nullable|in:cash,bank'
        ]);

        $split = ExpenseSplit::findOrFail($id);
        
        $owner = Owner::where('user_id', auth()->id())->first();
        if (!$owner || $split->owner_id !== $owner->id) {
            return response()->json(['error' => 'No puedes pagar la deuda de otro socio.'], 403);
        }

        if ($split->status === 'paid') {
            return response()->json(['error' => 'Esta deuda ya está pagada.'], 400);
        }

        if ($request->deducted_from_wallet) {
            if (!$request->fund_source) {
                return response()->json(['error' => 'Debes especificar de qué cuenta saldrá el dinero.'], 400);
            }
            $balance = $this->getTreasuryBalance($request->fund_source);
            if ($balance < $split->amount) {
                $accountName = $request->fund_source === 'cash' ? 'Caja Física' : 'Cuenta Bancaria';
                return response()->json(['error' => "Saldo insuficiente en $accountName para realizar el pago de Bs. {$split->amount}."], 400);
            }
        }

        DB::beginTransaction();
        try {
            $split->update([
                'status' => 'paid',
                'deducted_from_wallet' => $request->deducted_from_wallet ?? false,
                'fund_source' => ($request->deducted_from_wallet ?? false) ? $request->fund_source : null,
                'paid_at' => now(),
            ]);

            $expense = Expense::with('expense_splits')->findOrFail($split->expense_id);
            $allPaid = $expense->expense_splits->every(function ($s) {
                return $s->status === 'paid';
            });

            if ($allPaid) {
                $expense->status = 'paid';
                $expense->save();
            }

            DB::commit();
            return response()->json(['message' => 'Deuda pagada exitosamente.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function applySplits(Expense $expense, Request $request)
    {
        $owners = Owner::where('is_active', true)->get();
        if ($owners->isEmpty()) {
            throw new \Exception("No active owners found to split expense.");
        }

        $amount = (float) $expense->amount;

        $splitStatus = $expense->status === 'paid' ? 'paid' : 'pending';
        $splitDeducted = $expense->deducted_from_wallet;
        $splitFundSource = $expense->status === 'paid' && $splitDeducted ? $expense->fund_source : null;
        $splitPaidAt = $expense->status === 'paid' ? now() : null;

        if ($expense->split_type === 'equal') {
            $splitAmount = $amount / $owners->count();
            foreach ($owners as $owner) {
                ExpenseSplit::create([
                    'expense_id' => $expense->id,
                    'owner_id' => $owner->id,
                    'amount' => $splitAmount,
                    'percentage' => 100 / $owners->count(),
                    'status' => $splitStatus,
                    'deducted_from_wallet' => $splitDeducted,
                    'fund_source' => $splitFundSource,
                    'paid_at' => $splitPaidAt
                ]);
            }
        } elseif ($expense->split_type === 'single_owner') {
            ExpenseSplit::create([
                'expense_id' => $expense->id,
                'owner_id' => $request->owner_id,
                'amount' => $amount,
                'percentage' => 100,
                'status' => $splitStatus,
                'deducted_from_wallet' => $splitDeducted,
                'fund_source' => $splitFundSource,
                'paid_at' => $splitPaidAt
            ]);
        } elseif ($expense->split_type === 'custom') {
            $totalCustom = 0;
            foreach ($request->splits as $split) {
                $totalCustom += $split['amount'];
            }
            if (abs($totalCustom - $amount) > 0.01) {
                throw new \Exception("The sum of custom splits ($totalCustom) does not match the expense amount ($amount).");
            }
            foreach ($request->splits as $split) {
                ExpenseSplit::create([
                    'expense_id' => $expense->id,
                    'owner_id' => $split['owner_id'],
                    'amount' => $split['amount'],
                    'percentage' => ($split['amount'] / $amount) * 100,
                    'status' => $splitStatus,
                    'deducted_from_wallet' => $splitDeducted,
                    'fund_source' => $splitFundSource,
                    'paid_at' => $splitPaidAt
                ]);
            }
        } elseif ($expense->split_type === 'proportional') {
            // Get sales for the month of the expense
            $expenseDate = Carbon::parse($expense->expense_date);
            
            $salesPerOwner = [];
            $totalSales = 0;
            
            foreach ($owners as $owner) {
                $sales = SaleDetail::whereHas('sale', function($q) use ($expenseDate) {
                    $q->where('status', 'paid')
                      ->whereMonth('created_at', $expenseDate->month)
                      ->whereYear('created_at', $expenseDate->year);
                })
                ->where('owner_id', $owner->id)
                ->sum(DB::raw('subtotal - discount'));
                
                $salesPerOwner[$owner->id] = $sales;
                $totalSales += $sales;
            }
            
            if ($totalSales == 0) {
                // If no sales this month, fallback to equal
                $splitAmount = $amount / $owners->count();
                foreach ($owners as $owner) {
                    ExpenseSplit::create([
                        'expense_id' => $expense->id,
                        'owner_id' => $owner->id,
                        'amount' => $splitAmount,
                        'percentage' => 100 / $owners->count(),
                        'status' => $splitStatus,
                        'deducted_from_wallet' => $splitDeducted,
                        'fund_source' => $splitFundSource,
                        'paid_at' => $splitPaidAt
                    ]);
                }
            } else {
                foreach ($owners as $owner) {
                    $share = $salesPerOwner[$owner->id] / $totalSales;
                    ExpenseSplit::create([
                        'expense_id' => $expense->id,
                        'owner_id' => $owner->id,
                        'amount' => $amount * $share,
                        'percentage' => $share * 100,
                        'status' => $splitStatus,
                        'deducted_from_wallet' => $splitDeducted,
                        'fund_source' => $splitFundSource,
                        'paid_at' => $splitPaidAt
                    ]);
                }
            }
        }
    }

    protected function processRecurringExpenses()
    {
        // Generar gastos recurrentes SOLO cuando la fecha original del gasto ya pasó
        $allExpenses = Expense::with('expense_splits')->get();

        $recurringExpenses = $allExpenses->where('is_recurring', true);
        
        $today = Carbon::today();

        DB::beginTransaction();
        try {
            foreach ($recurringExpenses as $expense) {
                if (!$expense->recurrence_interval) continue;

                $expenseDate = Carbon::parse($expense->expense_date);
                
                // Si aún no ha pasado la fecha del gasto, NO generamos el siguiente
                if ($today->lte($expenseDate)) continue; 

                $nextDate = $expenseDate->copy();
                if ($expense->recurrence_interval === 'monthly') {
                    $nextDate->addMonth();
                } elseif ($expense->recurrence_interval === 'weekly') {
                    $nextDate->addWeek();
                } elseif ($expense->recurrence_interval === 'yearly') {
                    $nextDate->addYear();
                }

                // Revisar si ya existe el próximo gasto para evitar duplicados
                $exists = $allExpenses->where('name', $expense->name)
                                      ->where('branch_id', $expense->branch_id)
                                      ->filter(function($e) use ($nextDate) {
                                          return Carbon::parse($e->expense_date)->isSameDay($nextDate);
                                      })
                                      ->isNotEmpty();
                
                if (!$exists) {
                    $newExpense = $expense->replicate(['id']);
                    $newExpense->status = 'pending';
                    $newExpense->fund_source = null;
                    $newExpense->expense_date = $nextDate;
                    $newExpense->save();

                    foreach ($expense->expense_splits as $split) {
                        $newSplit = $split->replicate(['id', 'expense_id']);
                        $newSplit->expense_id = $newExpense->id;
                        $newSplit->status = 'pending';
                        $newSplit->deducted_from_wallet = false;
                        $newSplit->paid_at = null;
                        $newSplit->save();
                    }
                    
                    $allExpenses->push($newExpense);
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
        }
    }

    protected function getTreasuryBalance($type) {
        $cashMethod = \App\Models\Finance\PaymentMethod::where('name', 'Efectivo')->first();
        $cashMethodId = $cashMethod ? $cashMethod->id : null;
        
        if ($type === 'cash') {
            $sales = $cashMethodId ? \App\Models\Finance\Payment::where('payment_method_id', $cashMethodId)->sum('amount') : 0;
            $expenses = \App\Models\Finance\Expense::whereIn('status', ['paid', 'archived'])->where('fund_source', 'cash')->sum('amount');
            $splitExpenses = \App\Models\Finance\ExpenseSplit::whereIn('status', ['paid', 'archived'])->where('deducted_from_wallet', true)->where('fund_source', 'cash')->sum('amount');
            $deposits = \App\Models\Finance\OwnerPayment::where('type', 'deposit')->where('fund_source', 'cash')->sum('total_amount');
            $withdrawals = \App\Models\Finance\OwnerPayment::where('type', 'withdrawal')->where('fund_source', 'cash')->sum('total_amount');
            return $sales + $deposits - $expenses - $splitExpenses - $withdrawals;
        } elseif ($type === 'bank') {
            if ($cashMethodId) {
                $giftcardMethodIds = \App\Models\Finance\PaymentMethod::where('name', 'ILIKE', '%giftcard%')->pluck('id')->toArray();
                $bankQuery = \App\Models\Finance\Payment::where('payment_method_id', '!=', $cashMethodId);
                if (!empty($giftcardMethodIds)) {
                    $bankQuery->whereNotIn('payment_method_id', $giftcardMethodIds);
                }
                $sales = $bankQuery->sum('amount');
            } else {
                $sales = \App\Models\Finance\Payment::sum('amount');
            }
            $expenses = \App\Models\Finance\Expense::whereIn('status', ['paid', 'archived'])->where('fund_source', 'bank')->sum('amount');
            $splitExpenses = \App\Models\Finance\ExpenseSplit::whereIn('status', ['paid', 'archived'])->where('deducted_from_wallet', true)->where('fund_source', 'bank')->sum('amount');
            $deposits = \App\Models\Finance\OwnerPayment::where('type', 'deposit')->where('fund_source', 'bank')->sum('total_amount');
            $withdrawals = \App\Models\Finance\OwnerPayment::where('type', 'withdrawal')->where('fund_source', 'bank')->sum('total_amount');
            return $sales + $deposits - $expenses - $splitExpenses - $withdrawals;
        }
        return 0;
    }
}
