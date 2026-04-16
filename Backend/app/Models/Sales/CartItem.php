<?php

namespace App\Models\Sales;

use App\Models\Base\CartItem as BaseCartItem;

class CartItem extends BaseCartItem
{
	protected $fillable = [
		'cart_id',
		'variant_id',
		'quantity'
	];
}
