<?php

namespace App\Models\Logistics;

use App\Models\Base\Shipment as BaseShipment;

class Shipment extends BaseShipment
{
	protected $fillable = [
		'sale_id',
		'address_id',
		'status',
		'tracking_code',
		'shipped_at',
		'delivered_at'
	];
}
