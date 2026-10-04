<?php

namespace App\Models\Base;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use App\Models\Catalog\Product;
use App\Models\Catalog\ProductVariant;

/**
 * Class BundleItem
 * 
 * @property string $id
 * @property string|null $bundle_id
 * @property string|null $product_id
 * @property string|null $variant_id
 * @property int $quantity
 * @property Carbon|null $created_at
 * 
 * @property Product|null $bundle
 * @property Product|null $product
 * @property ProductVariant|null $variant
 *
 * @package App\Models\Base
 */
class BundleItem extends Model
{
	protected $table = 'bundle_items';
	public $incrementing = false;
	public $timestamps = false;
	protected $keyType = 'string';

	protected $casts = [
		'quantity' => 'int'
	];

	public function bundle()
	{
		return $this->belongsTo(Product::class, 'bundle_id');
	}

	public function product()
	{
		return $this->belongsTo(Product::class, 'product_id');
	}

	public function variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}
}
