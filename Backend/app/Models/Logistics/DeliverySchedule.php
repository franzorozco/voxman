<?php

namespace App\Models\Logistics;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DeliverySchedule extends Model
{
    use HasUuids;

    protected $table = 'delivery_schedules';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false; // DB has created_at DEFAULT CURRENT_TIMESTAMP but no updated_at

    protected $fillable = [
        'shipment_id',
        'scheduled_date',
        'time_window',
        'status',
        'driver_id',
        'meeting_point',
        'city',
        'latitude',
        'longitude',
        'original_delivery_zone_id',
        'checkout_session',
        'created_at'
    ];

    protected $casts = [
        'checkout_session' => 'array',
    ];

    public function shipment()
    {
        return $this->belongsTo(\App\Models\Logistics\Shipment::class, 'shipment_id');
    }

    public function driver()
    {
        return $this->belongsTo(\App\Models\Actors\Employee::class, 'driver_id');
    }
}
