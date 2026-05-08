<?php

namespace App\Models\Purchase;

use App\Models\Base\PurchaseReception as BasePurchaseReception;

class PurchaseReception extends BasePurchaseReception
{
	protected $fillable = [
		'purchase_id',
		'employee_id',
		'status',
		'notes',
	];
}