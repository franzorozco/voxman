<?php

namespace App\Models\Finance;

use App\Models\Base\CashMovement as BaseCashMovement;

class CashMovement extends BaseCashMovement
{
	protected $fillable = [
		'cash_register_id',
		'movement_type',
		'amount',
		'reference_type',
		'reference_id',
		'description'
	];
}
