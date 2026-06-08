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
		'reference',
		'stock_before',
		'stock_after',
		'reference_type',
		'reference_id',
		'notes'
	];

	public function user()
	{
		return $this->belongsTo(\App\Models\Core\User::class, 'created_by');
	}
}
