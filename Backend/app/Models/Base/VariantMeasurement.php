<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\MeasurementType;
use App\Models\ProductVariant;
use App\Models\Size;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class VariantMeasurement
 * 
 * @property uuid $id
 * @property uuid|null $variant_id
 * @property uuid|null $size_id
 * @property uuid|null $measurement_type_id
 * @property float|null $value
 * @property Carbon|null $created_at
 * 
 * @property ProductVariant|null $product_variant
 * @property Size|null $size
 * @property MeasurementType|null $measurement_type
 *
 * @package App\Models\Base
 */
class VariantMeasurement extends Model
{
	protected $table = 'variant_measurements';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid',
		'variant_id' => 'uuid',
		'size_id' => 'uuid',
		'measurement_type_id' => 'uuid',
		'value' => 'float'
	];

	public function product_variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}

	public function size()
	{
		return $this->belongsTo(Size::class);
	}

	public function measurement_type()
	{
		return $this->belongsTo(MeasurementType::class);
	}
}
