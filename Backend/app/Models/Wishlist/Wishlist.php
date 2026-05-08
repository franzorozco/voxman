<?php

namespace App\Models\Wishlist;

use App\Models\Base\Wishlist as BaseWishlist;

class Wishlist extends BaseWishlist
{
	protected $fillable = [
		'customer_id',
	];
}