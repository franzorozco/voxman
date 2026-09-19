<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Purchase\Supplier;
use App\Models\Purchase\Purchase;
use App\Models\Finance\PaymentMethod;

class SupplierPayment extends Model
{
    use HasUuids;

    protected $table = 'supplier_payments';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // Only has created_at

    protected $fillable = [
        'id',
        'supplier_id',
        'purchase_id',
        'amount',
        'payment_method_id',
        'status',
        'created_at'
    ];

    protected $casts = [
        'amount' => 'float',
        'created_at' => 'datetime'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }
}
