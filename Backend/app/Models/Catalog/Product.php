<?php

namespace App\Models\Catalog;

use App\Models\Base\Product as BaseProduct;

class Product extends BaseProduct
{
	protected $fillable = [
		'owner_id',
		'category_id',
		'product_type_id',
		'name',
		'description',
		'slug',
		'base_price',
		'is_active',
		'views'
	];
}
