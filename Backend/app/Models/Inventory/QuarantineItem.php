<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Purchase\PurchaseReception;
use App\Models\Catalog\ProductVariant;
use App\Models\Branch\Branch;

class QuarantineItem extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'quarantine_items';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'purchase_reception_id',
        'variant_id',
        'branch_id',
        'reason',
        'quantity',
        'resolved_quantity',
        'status',
        'notes',
    ];

    public function purchaseReception()
    {
        return $this->belongsTo(PurchaseReception::class, 'purchase_reception_id');
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
