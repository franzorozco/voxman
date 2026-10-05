<?php

namespace App\Models\Sales;

use App\Models\Base\SaleAppliedDiscount as BaseSaleAppliedDiscount;

class SaleAppliedDiscount extends BaseSaleAppliedDiscount
{
	protected $fillable = [
		'sale_id',
		'sale_detail_id',
		'discount_id',
		'discount_amount'
	];
}
