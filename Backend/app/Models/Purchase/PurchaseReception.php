<?php

namespace App\Models\Purchase;

use App\Models\Base\PurchaseReception as BasePurchaseReception;

class PurchaseReception extends BasePurchaseReception
{
	protected $fillable = [
		'id',
		'purchase_id',
		'employee_id',
		'status',
		'notes',
	];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }
}