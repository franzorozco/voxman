<?php

namespace App\Models\Finance;

use App\Models\Base\Expense as BaseExpense;

class Expense extends BaseExpense
{
	protected $fillable = [
		'branch_id',
		'name',
		'description',
		'amount',
		'expense_date',
		'type',
		'category',
		'status',
		'split_type',
		'is_recurring',
		'recurrence_interval',
		'fund_source',
		'deducted_from_wallet'
	];

	protected $casts = [
		'is_recurring' => 'boolean',
		'deducted_from_wallet' => 'boolean'
	];

	protected static function boot()
	{
		parent::boot();

		static::creating(function ($model) {
			if (!$model->id) {
				$model->id = (string) \Illuminate\Support\Str::uuid();
			}
		});
	}

	public function expense_splits()
	{
		return $this->hasMany(\App\Models\Finance\ExpenseSplit::class);
	}

	public function recalculateProportionalSplits()
	{
		if ($this->split_type !== 'proportional' || $this->status !== 'pending') {
			return;
		}

		$splits = $this->expense_splits;
		if ($splits->where('status', 'paid')->count() > 0) {
			return; // Do not recalculate if someone already paid based on old proportions
		}

		$owners = \App\Models\Actors\Owner::where('is_active', true)->get();
		$expenseDate = \Carbon\Carbon::parse($this->expense_date);
		
		$salesPerOwner = [];
		$totalSales = 0;
		
		foreach ($owners as $owner) {
			$sales = \App\Models\Sales\SaleDetail::whereHas('sale', function($q) use ($expenseDate) {
				$q->where('status', 'paid')
				  ->whereMonth('created_at', $expenseDate->month)
				  ->whereYear('created_at', $expenseDate->year);
			})
			->where('owner_id', $owner->id)
			->sum(\Illuminate\Support\Facades\DB::raw('subtotal - discount'));
			
			$salesPerOwner[$owner->id] = $sales;
			$totalSales += $sales;
		}
		
		foreach ($owners as $owner) {
			$split = $splits->where('owner_id', $owner->id)->first();
			if ($split) {
				if ($totalSales == 0) {
					$percentage = 100 / $owners->count();
					$amount = $this->amount / $owners->count();
				} else {
					$percentage = ($salesPerOwner[$owner->id] / $totalSales) * 100;
					$amount = $this->amount * ($salesPerOwner[$owner->id] / $totalSales);
				}
				
				$split->update([
					'percentage' => $percentage,
					'amount' => $amount
				]);
			}
		}
	}
}
