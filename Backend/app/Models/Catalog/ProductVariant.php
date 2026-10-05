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

	public function product()
	{
		return $this->belongsTo(\App\Models\Catalog\Product::class)->withTrashed();
	}

	public function size()
	{
		return $this->belongsTo(\App\Models\Catalog\Size::class, 'size_id');
	}

	public function fit()
	{
		return $this->belongsTo(\App\Models\Catalog\Fit::class, 'fit_id');
	}

	public function getNameAttribute()
	{
		$attributes = [];
		$color = null;
		$talla = $this->size ? 'Talla: ' . $this->size->name : null;
		$fit = $this->fit ? 'Fit: ' . $this->fit->name : null;
		$others = [];

		if ($this->relationLoaded('variant_attribute_values')) {
			foreach ($this->variant_attribute_values as $vav) {
				if ($vav->attribute_value && $vav->attribute_value->attribute) {
					$name = $vav->attribute_value->attribute->name;
					$val = $vav->attribute_value->value;
					
					if (strtolower($name) === 'color') {
						$color = 'Color: ' . $val;
					} elseif (strtolower($name) === 'talla' || strtolower($name) === 'size') {
						$talla = 'Talla: ' . $val;
					} elseif (strtolower($name) === 'fit') {
						$fit = 'Fit: ' . $val;
					} else {
						$others[] = $name . ': ' . $val;
					}
				}
			}
		}

		if ($talla) $attributes[] = $talla;
		if ($color) $attributes[] = $color;
		if ($fit) $attributes[] = $fit;
		
		$attributes = array_merge($attributes, $others);

		return !empty($attributes) ? implode(', ', $attributes) : 'Default';
	}
}
