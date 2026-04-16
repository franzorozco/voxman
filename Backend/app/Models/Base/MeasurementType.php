<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\ProductTypeMeasurement;
use App\Models\VariantMeasurement;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class MeasurementType
 * 
 * @property uuid $id
 * @property string $name
 * 
 * @property Collection|ProductTypeMeasurement[] $product_type_measurements
 * @property Collection|VariantMeasurement[] $variant_measurements
 *
 * @package App\Models\Base
 */
class MeasurementType extends Model
{
	protected $table = 'measurement_types';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid'
	];

	public function product_type_measurements()
	{
		return $this->hasMany(ProductTypeMeasurement::class);
	}

	public function variant_measurements()
	{
		return $this->hasMany(VariantMeasurement::class);
	}
}
