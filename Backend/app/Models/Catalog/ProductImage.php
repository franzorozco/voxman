<?php

namespace App\Models\Catalog;

use App\Models\Base\ProductImage as BaseProductImage;

class ProductImage extends BaseProductImage
{
	protected $fillable = [
		'product_id',
		'url',
		'is_main'
	];
}
