<?php

namespace App\Models\Discount;

use App\Models\Base\DiscountBrand as BaseDiscountBrand;

class DiscountBrand extends BaseDiscountBrand
{
	protected $fillable = [
		'discount_id',
		'brand_id'
	];
}
