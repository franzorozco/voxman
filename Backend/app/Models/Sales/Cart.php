<?php

namespace App\Models\Sales;

use App\Models\Base\Cart as BaseCart;

class Cart extends BaseCart
{
	protected $fillable = [
		'user_id',
		'reference_number',
		'status',
		'source',
		'expires_at',
		'updated_at'
	];

	protected $appends = ['total_amount'];

	public function getTotalAmountAttribute()
	{
		return $this->items->sum(function ($item) {
			$price = $item->product_variant->price ?? 0;
			return $price * $item->quantity;
		});
	}
}
