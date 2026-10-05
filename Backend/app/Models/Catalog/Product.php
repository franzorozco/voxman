<?php

namespace App\Models\Catalog;

use App\Models\Base\Product as BaseProduct;

class Product extends BaseProduct
{
    use \App\Traits\Auditable;
    
	protected $fillable = [
        // 'id' es necesario: el admin crea productos con 'id' => Str::uuid() (el modelo no usa HasUuids).
        // Seguro mientras ningún controlador haga create($request->all()) — verificado.
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

    public function inventories()
    {
        return $this->hasManyThrough(
            \App\Models\Inventory\Inventory::class,
            \App\Models\Catalog\ProductVariant::class,
            'product_id',
            'variant_id',
            'id',
            'id'
        );
    }
}