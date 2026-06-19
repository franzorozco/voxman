<?php

namespace App\Models\Sales;

use App\Models\Base\SaleDetail as BaseSaleDetail;

class SaleDetail extends BaseSaleDetail
{
	protected $fillable = [
		'sale_id',
		'variant_id',
		'owner_id',
		'quantity',
		'unit_price',
		'discount',
		'final_price',
		'subtotal'
	];

	public function product_variant()
	{
		return $this->belongsTo(\App\Models\Catalog\ProductVariant::class, 'variant_id')->withTrashed();
	}

	public function giftcard()
	{
		return $this->hasOne(\App\Models\Base\Giftcard::class, 'sale_detail_id');
	}
}
