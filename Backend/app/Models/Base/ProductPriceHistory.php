<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\ProductVariant;
use App\Models\User;
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
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid',
		'variant_id' => 'uuid',
		'old_price' => 'float',
		'new_price' => 'float',
		'changed_by' => 'uuid'
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
