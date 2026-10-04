<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Catalog\Fit;
use App\Models\Catalog\ProductVariant;
use App\Models\Catalog\Size;
use Illuminate\Database\Eloquent\Model;

/**
 * Class VariantSize
 * 
 * @property uuid $variant_id
 * @property uuid $size_id
 * @property uuid $fit_id
 * 
 * @property ProductVariant $product_variant
 * @property Size $size
 * @property Fit $fit
 *
 * @package App\Models\Base
 */
class VariantSize extends Model
{
	protected $table = 'variant_sizes';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
	];

	public function product_variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}

	public function size()
	{
		return $this->belongsTo(Size::class);
	}

	public function fit()
	{
		return $this->belongsTo(Fit::class);
	}
}
