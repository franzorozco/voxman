<?php

namespace App\Models\Sales;

use App\Models\Base\CartItem as BaseCartItem;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CartItem extends BaseCartItem
{
	use HasUuids;
	protected $fillable = [
		'cart_id',
		'variant_id',
		'quantity',
		'discount_amount'
	];

	public function variant()
	{
		return $this->belongsTo(\App\Models\Catalog\ProductVariant::class, 'variant_id')->withTrashed();
	}
}
