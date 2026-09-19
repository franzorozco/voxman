<?php

namespace App\Models\Catalog;

use App\Models\Base\ProductType as BaseProductType;

class ProductType extends BaseProductType
{
	protected $fillable = [
		'name'
	];

	public function measurement_types()
	{
		return $this->belongsToMany(\App\Models\Catalog\MeasurementType::class, 'product_type_measurements');
	}
}
