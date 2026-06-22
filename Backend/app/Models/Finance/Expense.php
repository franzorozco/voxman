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
		'split_type'
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
}
