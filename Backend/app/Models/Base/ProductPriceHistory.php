<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Catalog\ProductVariant;
use App\Models\Core\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ProductPriceHistory
 * 
 * @property uuid $id
 * @property uuid|null $variant_id
 * @property float|null $old_price
 * @property float|null $new_price
 * @property uuid|null $changed_by
 * @property Carbon|null $created_at
 * 
 * @property ProductVariant|null $product_variant
 * @property User|null $user
 *
 * @package App\Models\Base
 */
class ProductPriceHistory extends Model
{
	protected $table = 'product_price_history';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'old_price' => 'float',
		'new_price' => 'float',
	];

	public function product_variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}

	public function user()
	{
		return $this->belongsTo(User::class, 'changed_by');
	}
}
