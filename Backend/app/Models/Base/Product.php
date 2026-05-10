<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Catalog\Category;
use App\Models\Discount\Discount;
use App\Models\Actors\Owner;
use App\Models\Catalog\ProductImage;
use App\Models\Catalog\ProductType;
use App\Models\Catalog\ProductVariant;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Product
 * 
 * @property uuid $id
 * @property uuid|null $owner_id
 * @property uuid|null $category_id
 * @property uuid|null $product_type_id
 * @property string $name
 * @property string|null $description
 * @property string|null $slug
 * @property float $base_price
 * @property bool|null $is_active
 * @property int|null $views
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Owner|null $owner
 * @property Category|null $category
 * @property ProductType|null $product_type
 * @property Collection|ProductVariant[] $product_variants
 * @property Collection|ProductImage[] $product_images
 * @property Collection|Discount[] $discounts
 *
 * @package App\Models\Base
 */
class Product extends Model
{
	use SoftDeletes;
	protected $table = 'products';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
		
		'base_price' => 'float',
		'is_active' => 'bool',
		'views' => 'int'
	];
	
	public function owner()
	{
		return $this->belongsTo(Owner::class);
	}

	public function category()
	{
		return $this->belongsTo(Category::class);
	}

	public function product_type()
	{
		return $this->belongsTo(ProductType::class);
	}
	
	public function product_variants()
	{
		return $this->hasMany(ProductVariant::class);
	}

	public function product_images()
	{
		return $this->hasMany(ProductImage::class);
	}

	public function discounts()
	{
		return $this->belongsToMany(Discount::class, 'discount_products');
	}
}
