<?php

namespace App\Models\Catalog;

use App\Models\Base\ProductTypeMeasurement as BaseProductTypeMeasurement;

class ProductTypeMeasurement extends BaseProductTypeMeasurement
{
	protected $fillable = [
		'product_type_id',
		'measurement_type_id'
	];
}
