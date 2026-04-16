<?php

namespace App\Models\Catalog;

use App\Models\Base\ProductVariant as BaseProductVariant;

class ProductVariant extends BaseProductVariant
{
	protected $fillable = [
		'product_id',
		'sku',
		'barcode',
		'weight',
		'price',
		'cost',
		'is_active'
	];
}
