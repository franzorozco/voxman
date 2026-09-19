<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Catalog\ProductVariant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class VariantImage
 * 
 * @property uuid $id
 * @property uuid|null $variant_id
 * @property string $url
 * @property Carbon|null $created_at
 * 
 * @property ProductVariant|null $product_variant
 *
 * @package App\Models\Base
 */
class VariantImage extends Model
{
	protected $table = 'variant_images';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
	];

	public function product_variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}
}
