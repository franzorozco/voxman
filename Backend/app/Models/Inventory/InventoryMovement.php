<?php

namespace App\Models\Inventory;

use App\Models\Base\InventoryMovement as BaseInventoryMovement;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class InventoryMovement extends BaseInventoryMovement
{
    use HasUuids;
	protected $fillable = [
		'variant_id',
		'branch_id',
		'created_by',
		'movement_type',
		'quantity',
		'reference'
	];



}
