<?php

namespace App\Models\Finance;

use App\Models\Base\Expense as BaseExpense;

class Expense extends BaseExpense
{
	protected $fillable = [
		'branch_id',
		'name',
		'amount',
		'expense_date',
		'type',
		'split_type'
	];

	public function expense_splits()
	{
		return $this->hasMany(\App\Models\Finance\ExpenseSplit::class);
	}
}
