<?php

namespace App\Models\Inventory;

use App\Models\Base\InventoryMovement as BaseInventoryMovement;

class InventoryMovement extends BaseInventoryMovement
{
	protected $fillable = [
		'variant_id',
		'branch_id',
		'created_by',
		'movement_type',
		'quantity',
		'reference'
	];



    public function user()
    {
        return $this->belongsTo(\App\Models\Core\User::class, 'created_by');
    }
}
