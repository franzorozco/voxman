<?php

namespace App\Models\Sales;

use App\Models\Base\Sale as BaseSale;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Sale extends BaseSale
{
    use \App\Traits\Auditable, HasUuids;

    protected static function booted()
    {
        static::created(function ($sale) {
            \App\Models\Finance\Expense::with('expense_splits')
                ->where('status', 'pending')
                ->where('split_type', 'proportional')
                ->get()->each->recalculateProportionalSplits();
        });
    }
    
	protected $fillable = [
		'customer_id',
		'branch_id',
		'user_id',
		'sale_type',
		'status',
		'source',
		'subtotal',
		'discount_total',
		'total_discount',
		'total',
		'invoice_number',
		'notes',
		'discount_id',
        'guest_id'
	];

	public function guest()
	{
		return $this->belongsTo(\App\Models\Base\Guest::class, 'guest_id');
	}

	public function discount()
	{
		return $this->belongsTo(\App\Models\Discount\Discount::class, 'discount_id');
	}

	public function giftcard_transactions()
	{
		return $this->hasMany(\App\Models\Base\GiftcardTransaction::class, 'sale_id');
	}

	public function sale_applied_discounts()
	{
		return $this->hasMany(\App\Models\Sales\SaleAppliedDiscount::class, 'sale_id');
	}

	public function stockReservations()
	{
		return $this->hasMany(\App\Models\Inventory\StockReservation::class, 'sale_id');
	}
}
