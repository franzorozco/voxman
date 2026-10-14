<?php

namespace App\Models\Sales;

use App\Models\Base\Cart as BaseCart;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Cart extends BaseCart
{
	use HasUuids;
	protected $fillable = [
		'customer_id',
		'reference_number',
		'status',
		'source',
		'delivery_details',
		'expires_at',
		'updated_at',
		'discount_id',
		'total_discount',
        'guest_id'
	];

	protected $appends = ['total_amount', 'dynamic_subtotal', 'dynamic_global_discount'];

	protected $casts = [
		'delivery_details' => 'array',
		'expires_at' => 'datetime'
	];

	public function guest()
	{
		return $this->belongsTo(\App\Models\Base\Guest::class, 'guest_id');
	}

	public function discount()
	{
		return $this->belongsTo(\App\Models\Discount\Discount::class, 'discount_id');
	}

	public function getDynamicSubtotalAttribute()
	{
		return $this->items->sum(function ($item) {
			$price = $item->product_variant->price ?? 0;
            if ($item->override_price !== null) {
                $price = (float) $item->override_price;
            } elseif ($item->appliedDiscount) {
                $d = $item->appliedDiscount;
                $isValid = $d->active && (!$d->end_date || !$d->end_date->isPast()) && (!$d->start_date || !$d->start_date->isFuture());
                if ($isValid) {
                    if ($d->type === 'percentage') {
                        $price = $price - ($price * $d->value / 100);
                    } else {
                        $price = max(0, $price - $d->value);
                    }
                }
            }
			return $price * $item->quantity;
		});
	}

    public function getDynamicGlobalDiscountAttribute()
    {
        if (!$this->discount) {
            return 0;
        }

        $d = $this->discount;
        $isValid = $d->active && (!$d->end_date || !$d->end_date->isPast()) && (!$d->start_date || !$d->start_date->isFuture());
        if (!$isValid) {
            return 0;
        }
        
        $eligibleSubtotal = $this->items->sum(function ($item) {
            // Exclude bundles and native active discounts
            if ($item->bundle_group_id) {
                return 0;
            }
            if ($item->appliedDiscount) {
                $ad = $item->appliedDiscount;
                if ($ad->active && (!$ad->end_date || !$ad->end_date->isPast()) && (!$ad->start_date || !$ad->start_date->isFuture())) {
                    return 0;
                }
            }
            $price = $item->product_variant->price ?? 0;
            return $price * $item->quantity;
        });
        
        if ($eligibleSubtotal <= 0) {
            return 0;
        }

        if ($this->discount->type === 'percentage') {
            return round($eligibleSubtotal * $this->discount->value / 100, 2);
        } else {
            return min($eligibleSubtotal, $this->discount->value);
        }
    }

	public function getTotalAmountAttribute()
	{
		$subtotal = $this->dynamic_subtotal;
		$discount = $this->dynamic_global_discount;
		return max(0, $subtotal - $discount);
	}
}


