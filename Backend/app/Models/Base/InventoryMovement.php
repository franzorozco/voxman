<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Branch\Branch;
use App\Models\Catalog\ProductVariant;
use App\Models\Core\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class InventoryMovement
 * 
 * @property uuid $id
 * @property uuid|null $variant_id
 * @property uuid|null $branch_id
 * @property uuid|null $user_id
 * @property string|null $type
 * @property int|null $quantity
 * @property string|null $reference
 * @property Carbon|null $created_at
 * 
 * @property ProductVariant|null $product_variant
 * @property Branch|null $branch
 * @property User|null $user
 *
 * @package App\Models\Base
 */
class InventoryMovement extends Model
{
	protected $table = 'inventory_movements';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'quantity' => 'int'
	];

	public function variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}

	public function employee()
	{
		return $this->belongsTo(Employee::class);
	}

	public function branch()
	{
		return $this->belongsTo(Branch::class);
	}
}
