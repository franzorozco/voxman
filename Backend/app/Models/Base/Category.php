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
 * Class Category
 * 
 * @property uuid $id
 * @property string $name
 * @property uuid|null $parent_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property \App\Models\Category|null $category
 * @property Collection|\App\Models\Category[] $categories
 * @property Collection|Product[] $products
 * @property Collection|DiscountCategory[] $discount_categories
 *
 * @package App\Models\Base
 */
class Category extends Model
{
	use SoftDeletes;
	protected $table = 'categories';
	public $incrementing = false;

	protected $casts = [
		'id' => 'uuid',
		'parent_id' => 'uuid'
	];

	public function employee()
	{
		return $this->belongsTo(Employee::class);
	}

	public function category()
	{
		return $this->belongsTo(\App\Models\Category::class, 'parent_id');
	}

	public function categories()
	{
		return $this->hasMany(\App\Models\Category::class, 'parent_id');
	}

	public function products()
	{
		return $this->hasMany(Product::class);
	}

	public function discount_categories()
	{
		return $this->hasMany(DiscountCategory::class);
	}
}
