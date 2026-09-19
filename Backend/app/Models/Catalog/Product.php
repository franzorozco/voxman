<?php

namespace App\Models\Catalog;

use App\Models\Base\Product as BaseProduct;

class Product extends BaseProduct
{
    use \App\Traits\Auditable;
    
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
		'is_bundle',
		'views',
		'tags'
	];

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function attribute_value_images()
    {
        return $this->hasMany(AttributeValueImage::class, 'product_id');
    }

    public function shorts()
    {
        return $this->hasMany(\App\Models\Shop\ShopShort::class, 'product_id')->where('is_active', true);
    }
}