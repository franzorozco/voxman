<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\DiscountCategory;
use App\Models\Product;
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
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Collection|Product[] $products
 * @property Collection|DiscountCategory[] $discount_categories
 *
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
}
