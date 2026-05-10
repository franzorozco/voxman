<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Cart;
use App\Models\ProductVariant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class CartItem
 * 
 * @property uuid $id
 * @property uuid|null $cart_id
 * @property uuid|null $variant_id
 * @property int $quantity
 * @property Carbon|null $created_at
 * 
 * @property Cart|null $cart
 * @property ProductVariant|null $product_variant
 *
 * @package App\Models\Base
 */
class CartItem extends Model
{
	protected $table = 'cart_items';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'quantity' => 'int'
	];

	public function cart()
	{
		return $this->belongsTo(Cart::class);
	}

	public function product_variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}
}
