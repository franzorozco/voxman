<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Discount\DiscountCategory;
use App\Models\Catalog\Product;
use App\Models\Catalog\Category;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Discount
 * 
 * @property uuid $id
 * @property string $name
 * @property string|null $type
 * @property float $value
 * @property Carbon|null $start_date
 * @property Carbon|null $end_date
 * @property bool|null $active
 * @property string|null $code
 * @property bool|null $is_automatic
 * @property float|null $min_purchase_amount
 * @property int|null $min_quantity
 * @property float|null $max_discount_amount
 * @property int|null $usage_limit
 * @property int|null $used_count
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Collection|Product[] $products
 * @property Collection|DiscountCategory[] $discount_categories
 * @property Collection|DiscountCategory[] $discount_categories
 * @property Collection|\App\Models\Catalog\Brand[] $brands
 * @property Collection|\App\Models\Sales\SaleAppliedDiscount[] $sale_applied_discounts
 * @package App\Models\Base
 */
class Discount extends Model
{
	use SoftDeletes;
	protected $table = 'discounts';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
		'value' => 'float',
		'is_automatic' => 'bool',
		'min_purchase_amount' => 'float',
		'min_quantity' => 'int',
		'max_discount_amount' => 'float',
		'usage_limit' => 'int',
		'used_count' => 'int',
		'start_date' => 'datetime',
		'end_date' => 'datetime',
		'active' => 'bool'
	];

	public function products()
	{
		return $this->belongsToMany(Product::class, 'discount_products');
	}

	public function discount_categories()
	{
		return $this->hasMany(DiscountCategory::class);
	}

	public function categories()
	{
		return $this->belongsToMany(
			Category::class,
			'discount_categories',
			'discount_id',
			'category_id'
		);
	}

	public function brands()
	{
		return $this->belongsToMany(
			\App\Models\Catalog\Brand::class,
			'discount_brands',
			'discount_id',
			'brand_id'
		);
	}

	public function sale_applied_discounts()
	{
		return $this->hasMany(\App\Models\Sales\SaleAppliedDiscount::class, 'discount_id');
	}
}
