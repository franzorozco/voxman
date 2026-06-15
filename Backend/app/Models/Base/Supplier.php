<?php

namespace App\Models\Base;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes;
    protected $table = 'suppliers';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'contact_name',
        'phone',
        'email',
        'address_id',
        'company_name',
        'tax_id',
        'status'
    ];

    public function address()
    {
        return $this->belongsTo(Address::class);
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }
}
