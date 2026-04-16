<?php

namespace App\Models\Inventory;

use App\Models\Base\StockReservation as BaseStockReservation;

class StockReservation extends BaseStockReservation
{
	protected $fillable = [
		'variant_id',
		'branch_id',
		'sale_id',
		'quantity',
		'status'
	];
}
