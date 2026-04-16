<?php

namespace App\Models\Sales;

use App\Models\Base\SaleDetail as BaseSaleDetail;

class SaleDetail extends BaseSaleDetail
{
	protected $fillable = [
		'sale_id',
		'variant_id',
		'owner_id',
		'quantity',
		'unit_price',
		'discount',
		'final_price',
		'subtotal'
	];
}
