<?php

namespace App\Models\Logistics;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ShipmentTracking extends Model
{
    use HasUuids;

    protected $table = 'shipment_tracking';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false; // Solo usa created_at

    protected $fillable = [
        'shipment_id',
        'status',
        'description',
        'created_at'
    ];

    public function shipment()
    {
        return $this->belongsTo(\App\Models\Logistics\Shipment::class, 'shipment_id');
    }
}
