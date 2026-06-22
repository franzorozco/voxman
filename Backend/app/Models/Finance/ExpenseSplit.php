<?php

namespace App\Models\Finance;

use App\Models\Base\ExpenseSplit as BaseExpenseSplit;

class ExpenseSplit extends BaseExpenseSplit
{
	protected $fillable = [
		'expense_id',
		'owner_id',
		'amount',
		'percentage'
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
}
