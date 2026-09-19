<?php

namespace App\Models\Purchase;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SupplierReturn extends Model
{
    use HasUuids;

    protected $table = 'supplier_returns';

    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'supplier_id',
        'purchase_id',
        'variant_id',
        'quantity',
        'reason',
        'created_at'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    public function variant()
    {
        return $this->belongsTo(\App\Models\Catalog\ProductVariant::class, 'variant_id');
    }
}
