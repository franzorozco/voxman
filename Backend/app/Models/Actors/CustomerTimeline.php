<?php

namespace App\Models\Actors;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CustomerTimeline extends Model
{
    use HasUuids;

    protected $fillable = [
        'customer_id',
        'event_type',
        'description',
        'created_by'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\Core\User::class, 'created_by');
    }
}
