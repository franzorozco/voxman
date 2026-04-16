<?php

namespace App\Models\Catalog;

use App\Models\Base\ProductType as BaseProductType;

class ProductType extends BaseProductType
{
	protected $fillable = [
		'name'
	];
}
