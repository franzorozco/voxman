<?php

namespace App\Models\Catalog;

use App\Models\Base\Product as BaseProduct;

class Product extends BaseProduct
{
	protected $fillable = [

        'id',

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

    public function attribute_value_images()
    {
        return $this->hasMany(AttributeValueImage::class, 'product_id');
    }
}