<?php

namespace App\Models\Inventory;

use App\Models\Base\Inventory as BaseInventory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Inventory extends BaseInventory
{
    use HasUuids;
	protected $fillable = [
		'branch_id',
		'variant_id',
		'stock',
		'min_stock'
	];

	public function variant()
	{
		return $this->belongsTo(\App\Models\Catalog\ProductVariant::class, 'variant_id')->withTrashed();
	}
}
