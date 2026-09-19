<?php

namespace App\Models\Base;

use App\Models\Catalog\ProductVariant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class PurchaseDetail
 * 
 * @property string $id
 * @property string|null $purchase_id
 * @property string|null $variant_id
 * @property int $quantity
 * @property float $unit_cost
 * @property float $subtotal
 * @property Carbon|null $created_at
 * 
 * @property Purchase|null $purchase
 * @property ProductVariant|null $product_variant
 *
 * @package App\Models\Base
 */
class PurchaseDetail extends Model
{
	protected $table = 'purchase_details';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'quantity' => 'int',
		'unit_cost' => 'float',
		'subtotal' => 'float'
	];

	public function purchase()
	{
		return $this->belongsTo(Purchase::class);
	}

	public function product_variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}
}
