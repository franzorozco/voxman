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
		'pickup_branch_id',
		'shipping_cost',
        'agency_dispatch_cost',
        'external_company',
        'external_guide',
        'shipping_payment_type',
        'notes',
        'recipient_name',
        'recipient_ci',
        'recipient_phone',
        'destination_city',
        'recipient_edit_session'
	];

    protected $casts = [
        'recipient_edit_session' => 'array',
    ];

    public function delivery_schedule()
    {
        return $this->hasOne(\App\Models\Logistics\DeliverySchedule::class, 'shipment_id');
    }

    public function tracking_history()
    {
        return $this->hasMany(\App\Models\Logistics\ShipmentTracking::class, 'shipment_id')->orderBy('created_at', 'asc');
    }

    public function pickupBranch()
    {
        return $this->belongsTo(\App\Models\Branch\Branch::class, 'pickup_branch_id');
    }
}
