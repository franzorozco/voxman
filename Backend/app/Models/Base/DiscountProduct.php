<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Discount;
use App\Models\Product;
use Illuminate\Database\Eloquent\Model;

/**
 * Class DiscountProduct
 * 
 * @property uuid $discount_id
 * @property uuid $product_id
 * 
 * @property Discount $discount
 * @property Product $product
 *
 * @package App\Models\Base
 */
class DiscountProduct extends Model
{
	protected $table = 'discount_products';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
	];

	public function discount()
	{
		return $this->belongsTo(Discount::class);
	}

	public function product()
	{
		return $this->belongsTo(Product::class);
	}
}
