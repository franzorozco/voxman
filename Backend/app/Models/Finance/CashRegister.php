<?php

namespace App\Models\Finance;

use App\Models\Base\CashRegister as BaseCashRegister;

class CashRegister extends BaseCashRegister
{
	protected $fillable = [
		'branch_id',
		'user_id',
		'opening_amount',
		'closing_amount',
		'opened_at',
		'closed_at',
		'status'
	];
}
