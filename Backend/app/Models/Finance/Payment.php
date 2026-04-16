<?php

namespace App\Models\Finance;

use App\Models\Base\Payment as BasePayment;

class Payment extends BasePayment
{
	protected $fillable = [
		'sale_id',
		'cash_register_id',
		'payment_method_id',
		'amount',
		'currency',
		'status',
		'transaction_reference'
	];
}
