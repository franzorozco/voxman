<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Fit;
use App\Models\ProductVariant;
use App\Models\Size;
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
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'variant_id' => 'uuid',
		'size_id' => 'uuid',
		'fit_id' => 'uuid'
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
