<?php

namespace App\Models\Logistics;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShipmentCostDetail extends Model
{
    use HasFactory;

    protected $table = 'shipment_cost_details';
    public $timestamps = true;
    const UPDATED_AT = null;

    protected $fillable = [
        'shipment_id',
        'base_cost',
        'distance_cost',
        'extra_cost',
        'total'
    ];

    public function shipment()
    {
        return $this->belongsTo(Shipment::class);
    }
}
