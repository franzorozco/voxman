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
}
