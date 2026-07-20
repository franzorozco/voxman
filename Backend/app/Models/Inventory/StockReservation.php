<?php

namespace App\Models\Inventory;

use App\Models\Base\StockReservation as BaseStockReservation;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StockReservation extends BaseStockReservation
{
    use HasUuids;
	protected $fillable = [
		'variant_id',
		'branch_id',
		'sale_id',
		'quantity',
		'status'
	];

	public function variant()
	{
		return $this->belongsTo(\App\Models\Catalog\ProductVariant::class, 'variant_id')->withTrashed();
	}
}
