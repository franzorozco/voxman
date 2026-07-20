<?php

namespace App\Models\Base;

use Illuminate\Database\Eloquent\Model;

class Guest extends Model
{
    protected $table = 'guests';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'whatsapp_phone'
    ];

    public function carts()
    {
        return $this->hasMany(\App\Models\Sales\Cart::class, 'guest_id');
    }

    public function sales()
    {
        return $this->hasMany(\App\Models\Sales\Sale::class, 'guest_id');
    }
}
