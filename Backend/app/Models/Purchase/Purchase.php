<?php

namespace App\Models\Purchase;

use App\Models\Base\Purchase as BasePurchase;

class Purchase extends BasePurchase
{
    use \App\Traits\Auditable;
    
	protected $fillable = [
		'id',
		'supplier_id',
		'branch_id',
		'employee_id',
		'status',
		'subtotal',
		'tax',
		'total',
		'invoice_number',
		'notes',
	];
}