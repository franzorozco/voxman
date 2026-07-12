<?php

namespace App\Models\Actors;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PosCustomerProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'pos_customer_profiles';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'customer_id',
        'first_name',
        'last_name_paternal',
        'last_name_maternal',
        'phone',
    ];

    /**
     * Get the customer that owns the profile.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
