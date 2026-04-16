<?php

namespace App\Models\Discount;

use App\Models\Base\Discount as BaseDiscount;

class Discount extends BaseDiscount
{
	protected $fillable = [
		'name',
		'type',
		'value',
		'start_date',
		'end_date',
		'active'
	];
}
