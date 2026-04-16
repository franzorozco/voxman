<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Product;
use App\Models\ProductTypeMeasurement;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class ProductType
 * 
 * @property uuid $id
 * @property string $name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Collection|Product[] $products
 * @property Collection|ProductTypeMeasurement[] $product_type_measurements
 *
 * @package App\Models\Base
 */
class ProductType extends Model
{
	use SoftDeletes;
	protected $table = 'product_types';
	public $incrementing = false;

	protected $casts = [
		'id' => 'uuid'
	];

	public function products()
	{
		return $this->hasMany(Product::class);
	}

	public function product_type_measurements()
	{
		return $this->hasMany(ProductTypeMeasurement::class);
	}
}
