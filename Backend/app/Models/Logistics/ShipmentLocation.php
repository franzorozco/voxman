<?php

namespace App\Models\Logistics;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShipmentLocation extends Model
{
    use HasFactory;

    protected $table = 'shipment_locations';
    public $timestamps = true;
    const UPDATED_AT = null;

    protected $fillable = [
        'shipment_id',
        'latitude',
        'longitude'
    ];

    public function shipment()
    {
        return $this->belongsTo(Shipment::class);
    }
}
