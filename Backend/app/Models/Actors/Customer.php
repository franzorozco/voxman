<?php

namespace App\Models\Actors;

use App\Models\Base\Customer as BaseCustomer;

class Customer extends BaseCustomer
{
	protected $fillable = [
		'user_id',
		'customer_code',
		'points',
		'total_purchases'
	];
}