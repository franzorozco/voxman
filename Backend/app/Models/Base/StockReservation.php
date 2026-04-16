<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Branch;
use App\Models\ProductVariant;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class StockReservation
 * 
 * @property uuid $id
 * @property uuid|null $variant_id
 * @property uuid|null $branch_id
 * @property uuid|null $sale_id
 * @property int $quantity
 * @property string|null $status
 * @property Carbon|null $created_at
 * 
 * @property ProductVariant|null $product_variant
 * @property Branch|null $branch
 * @property Sale|null $sale
 *
 * @package App\Models\Base
 */
class StockReservation extends Model
{
	protected $table = 'stock_reservations';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid',
		'variant_id' => 'uuid',
		'branch_id' => 'uuid',
		'sale_id' => 'uuid',
		'quantity' => 'int'
	];

	public function product_variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}

	public function branch()
	{
		return $this->belongsTo(Branch::class);
	}

	public function sale()
	{
		return $this->belongsTo(Sale::class);
	}
}
