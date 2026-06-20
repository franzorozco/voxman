<?php

namespace App\Http\Controllers\Api\Admin\Finance;

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
            // For custom
            'splits' => 'required_if:split_type,custom|array',
            'splits.*.owner_id' => 'required_with:splits|uuid',
            'splits.*.amount' => 'required_with:splits|numeric|min:0',
            // For single_owner
            'owner_id' => 'required_if:split_type,single_owner|uuid'
        ]);

        DB::beginTransaction();
        try {
            $expense = Expense::create($request->only([
                'branch_id', 'name', 'description', 'amount', 'expense_date', 'category', 'status', 'split_type'
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
            'split_type' => 'required|in:equal,proportional,custom,single_owner'
        ]);

        $expense = Expense::findOrFail($id);

        DB::beginTransaction();
        try {
            $expense->update($request->only([
                'branch_id', 'name', 'description', 'amount', 'expense_date', 'category', 'status', 'split_type'
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
        $expense->delete(); // Automatically deletes splits via ON DELETE CASCADE
        return response()->json(['message' => 'Expense deleted successfully']);
    }

    private function applySplits(Expense $expense, Request $request)
    {
        $owners = Owner::where('is_active', true)->get();
        if ($owners->isEmpty()) {
            throw new \Exception("No active owners found to split expense.");
        }

        $amount = (float) $expense->amount;

        if ($expense->split_type === 'equal') {
            $splitAmount = $amount / $owners->count();
            foreach ($owners as $owner) {
                ExpenseSplit::create([
                    'expense_id' => $expense->id,
                    'owner_id' => $owner->id,
                    'amount' => $splitAmount,
                    'percentage' => 100 / $owners->count()
                ]);
            }
        } elseif ($expense->split_type === 'single_owner') {
            ExpenseSplit::create([
                'expense_id' => $expense->id,
                'owner_id' => $request->owner_id,
                'amount' => $amount,
                'percentage' => 100
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
                    'percentage' => ($split['amount'] / $amount) * 100
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
                        'percentage' => 100 / $owners->count()
                    ]);
                }
            } else {
                foreach ($owners as $owner) {
                    $share = $salesPerOwner[$owner->id] / $totalSales;
                    ExpenseSplit::create([
                        'expense_id' => $expense->id,
                        'owner_id' => $owner->id,
                        'amount' => $amount * $share,
                        'percentage' => $share * 100
                    ]);
                }
            }
        }
    }
}
