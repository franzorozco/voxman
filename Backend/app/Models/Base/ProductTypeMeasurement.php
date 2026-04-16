<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\MeasurementType;
use App\Models\ProductType;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ProductTypeMeasurement
 * 
 * @property uuid $id
 * @property uuid|null $product_type_id
 * @property uuid|null $measurement_type_id
 * 
 * @property ProductType|null $product_type
 * @property MeasurementType|null $measurement_type
 *
 * @package App\Models\Base
 */
class ProductTypeMeasurement extends Model
{
	protected $table = 'product_type_measurements';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid',
		'product_type_id' => 'uuid',
		'measurement_type_id' => 'uuid'
	];

	public function product_type()
	{
		return $this->belongsTo(ProductType::class);
	}

	public function measurement_type()
	{
		return $this->belongsTo(MeasurementType::class);
	}
}
