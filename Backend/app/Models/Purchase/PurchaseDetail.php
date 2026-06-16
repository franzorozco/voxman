<?php

namespace App\Models\Purchase;

use App\Models\Base\PurchaseDetail as BasePurchaseDetail;

class PurchaseDetail extends BasePurchaseDetail
{
	protected $fillable = [
		'id',
		'purchase_id',
		'variant_id',
		'quantity',
		'unit_cost',
		'subtotal'
	];
}
