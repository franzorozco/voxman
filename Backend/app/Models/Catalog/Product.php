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
        'brand_id',
		'name',
		'description',
		'slug',
		'base_price',
		'is_active',
		'views'
	];

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function attribute_value_images()
    {
        return $this->hasMany(AttributeValueImage::class, 'product_id');
    }
}