<?php

namespace App\Models\Inventory;

use App\Models\Base\Inventory as BaseInventory;

class Inventory extends BaseInventory
{
	protected $fillable = [
		'branch_id',
		'variant_id',
		'stock',
		'min_stock'
	];

}
