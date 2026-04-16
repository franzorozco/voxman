<?php

namespace App\Models\Catalog;

use App\Models\Base\VariantMeasurement as BaseVariantMeasurement;

class VariantMeasurement extends BaseVariantMeasurement
{
	protected $fillable = [
		'variant_id',
		'size_id',
		'measurement_type_id',
		'value'
	];
}
