<?php

namespace App\Models\Inventory;

use App\Models\Base\InventoryMovement as BaseInventoryMovement;

class InventoryMovement extends BaseInventoryMovement
{
	protected $fillable = [
		'variant_id',
		'branch_id',
		'user_id',
		'type',
		'quantity',
		'reference'
	];
}
