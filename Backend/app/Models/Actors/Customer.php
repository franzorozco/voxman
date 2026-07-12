<?php

namespace App\Models\Actors;

use App\Models\Base\Customer as BaseCustomer;

class Customer extends BaseCustomer
{
	protected $fillable = [
		'user_id',
		'is_active',
		'customer_code',
		'points',
		'total_purchases'
	];

	public function posProfile()
	{
		return $this->hasOne(PosCustomerProfile::class, 'customer_id');
	}
}