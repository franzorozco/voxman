<?php

namespace App\Models\Finance;

use App\Models\Base\OwnerPayment as BaseOwnerPayment;

class OwnerPayment extends BaseOwnerPayment
{
	protected $fillable = [
		'owner_id',
		'total_amount',
		'status',
		'payment_date'
	];
}
