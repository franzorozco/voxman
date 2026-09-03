<?php

namespace App\Models\Sales;

use App\Models\Base\SaleDetail as BaseSaleDetail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SaleDetail extends BaseSaleDetail
{
    use HasUuids;
	protected $fillable = [
		'sale_id',
		'variant_id',
		'owner_id',
		'quantity',
		'unit_price',
		'discount',
		'discount_amount',
		'original_price',
        'bundle_price',
		'bundle_group_id',
		'final_price',
		'subtotal'
	];

	public static function boot()
	{
		parent::boot();

		static::creating(function ($saleDetail) {
			if (empty($saleDetail->owner_id) && !empty($saleDetail->variant_id)) {
				$variant = \App\Models\Catalog\ProductVariant::with('product')->find($saleDetail->variant_id);
				if ($variant && $variant->product) {
					$saleDetail->owner_id = $variant->product->owner_id;
				}
			}
		});
	}

	public function product_variant()
	{
		return $this->belongsTo(\App\Models\Catalog\ProductVariant::class, 'variant_id')->withTrashed();
	}

	public function owner_payment_details()
	{
		return $this->hasMany(\App\Models\Finance\OwnerPaymentDetail::class, 'sale_detail_id');
	}

	public function return_request()
	{
		return $this->hasOne(\App\Models\Sales\Returns::class, 'sale_detail_id');
	}

	public function giftcard()
	{
		return $this->belongsTo(\App\Models\Finance\Giftcard::class, 'gift_card_id');
	}
}
