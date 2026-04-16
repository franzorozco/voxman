<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Branch;
use App\Models\ProductVariant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Inventory
 * 
 * @property uuid $id
 * @property uuid|null $branch_id
 * @property uuid|null $variant_id
 * @property int|null $stock
 * @property int|null $min_stock
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Branch|null $branch
 * @property ProductVariant|null $product_variant
 *
 * @package App\Models\Base
 */
class Inventory extends Model
{
	use SoftDeletes;
	protected $table = 'inventories';
	public $incrementing = false;

	protected $casts = [
		'id' => 'uuid',
		'branch_id' => 'uuid',
		'variant_id' => 'uuid',
		'stock' => 'int',
		'min_stock' => 'int'
	];

	public function branch()
	{
		return $this->belongsTo(Branch::class);
	}

	public function product_variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}
}
