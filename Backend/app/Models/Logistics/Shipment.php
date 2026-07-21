<?php

namespace App\Models\Logistics;

use App\Models\Base\Shipment as BaseShipment;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Shipment extends BaseShipment
{
    use HasUuids;
	protected $fillable = [
		'sale_id',
		'address_id',
		'status',
		'tracking_code',
		'shipped_at',
		'delivered_at',
		'delivery_code',
		'delivery_type',
		'shipping_cost'
	];

    public function delivery_schedule()
    {
        return $this->hasOne(\App\Models\Logistics\DeliverySchedule::class, 'shipment_id');
    }
}
