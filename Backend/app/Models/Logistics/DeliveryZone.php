<?php

namespace App\Models\Logistics;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DeliveryZone extends Model
{
    use HasUuids;

    protected $table = 'delivery_zones';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'name',
        'city',
        'base_cost',
        'extra_cost_per_km',
        'latitude',
        'longitude',
        'created_at'
    ];
}
