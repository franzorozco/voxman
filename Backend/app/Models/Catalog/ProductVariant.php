<?php

namespace App\Models\Catalog;

use App\Models\Base\ProductVariant as BaseProductVariant;

class ProductVariant extends BaseProductVariant
{
	protected $fillable = [
		'product_id',
		'size_id',
		'fit_id',
		'sku',
		'barcode',
		'weight',
		'price',
		'cost',
		'is_active'
	];
}
