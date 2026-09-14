<?php

namespace App\Models\Core;

use App\Models\Base\Address as BaseAddress;

class Address extends BaseAddress
{
	protected $fillable = [
		'customer_id',
		'branch_id',
		'address_type',
		'country',
		'state',
		'city',
		'zone',
		'street',
		'reference',
		'latitude',
		'longitude'
	];
}
