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

	protected $appends = ['total_amount'];

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

	public function getTotalAmountAttribute()
	{
		$subtotal = $this->items->sum(function ($item) {
			$price = $item->override_price !== null ? $item->override_price : ($item->product_variant->price ?? 0);
			return $price * $item->quantity;
		});

		$discount = $this->total_discount ?? 0;
		return max(0, $subtotal - $discount);
	}
}


