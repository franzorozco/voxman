<?php

namespace App\Models\Purchase;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PurchaseReceptionDetail extends Model
{
    use HasUuids;

    protected $table = 'purchase_reception_details';
    
    public $timestamps = false;

    protected $fillable = [
        'reception_id',
        'variant_id',
        'expected_quantity',
        'received_quantity',
        'damaged_quantity',
        'wrong_quantity',
        'extra_quantity',
        'accepted_quantity',
        'created_at'
    ];

    public function purchase_reception()
    {
        return $this->belongsTo(PurchaseReception::class, 'reception_id');
    }

    public function product_variant()
    {
        return $this->belongsTo(\App\Models\Catalog\ProductVariant::class, 'variant_id');
    }
}
