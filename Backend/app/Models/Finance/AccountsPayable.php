<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Purchase\Purchase;
use App\Models\Purchase\Supplier;

class AccountsPayable extends Model
{
    use HasUuids;

    protected $table = 'accounts_payable';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // Only has created_at

    protected $fillable = [
        'id',
        'supplier_id',
        'purchase_id',
        'total_amount',
        'paid_amount',
        'balance',
        'due_date',
        'status',
        'created_at'
    ];

    protected $casts = [
        'total_amount' => 'float',
        'paid_amount' => 'float',
        'balance' => 'float',
        'due_date' => 'date',
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
}
