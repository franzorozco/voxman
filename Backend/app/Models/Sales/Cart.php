<?php

namespace App\Models\Sales;

use App\Models\Base\Cart as BaseCart;

class Cart extends BaseCart
{
	protected $fillable = [
		'user_id'
	];
}
