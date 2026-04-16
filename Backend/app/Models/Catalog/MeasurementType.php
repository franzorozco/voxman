<?php

namespace App\Models\Catalog;

use App\Models\Base\MeasurementType as BaseMeasurementType;

class MeasurementType extends BaseMeasurementType
{
	protected $fillable = [
		'name'
	];
}
