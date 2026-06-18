<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Actors\Owner;
use App\Models\Finance\OwnerPaymentDetail;
use App\Models\Catalog\ProductVariant;
use App\Models\Sales\Sale;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class SaleDetail
 * 
 * @property uuid $id
 * @property uuid|null $sale_id
 * @property uuid|null $variant_id
 * @property uuid|null $owner_id
 * @property int $quantity
 * @property float $unit_price
 * @property float|null $discount
 * @property float $final_price
 * @property float $subtotal
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Sale|null $sale
 * @property ProductVariant|null $product_variant
 * @property Owner|null $owner
 * @property Collection|Return[] $returns
 * @property Collection|OwnerPaymentDetail[] $owner_payment_details
 *
 * @package App\Models\Base
 */
class SaleDetail extends Model
{
	use SoftDeletes;
	protected $table = 'sale_details';
	protected $keyType = 'string';
	public $incrementing = false;
	

	protected $casts = [
		'quantity' => 'int',
		'unit_price' => 'float',
		'discount' => 'float',
		'final_price' => 'float',
		'subtotal' => 'float'
	];

	public function sale()
	{
		return $this->belongsTo(Sale::class);
	}

	public function product_variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}

	public function owner()
	{
		return $this->belongsTo(Owner::class);
	}

	/*
	public function returns()
	{
		return $this->hasMany(\App\Models\Returns\ReturnModel::class);
	}
	*/

	public function owner_payment_details()
	{
		return $this->hasMany(OwnerPaymentDetail::class);
	}
}
