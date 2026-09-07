<?php

namespace App\Models\Sales;

use App\Models\Base\SaleDetail as BaseSaleDetail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SaleDetail extends BaseSaleDetail
{
    use HasUuids;

	protected $appends = [
		'dynamic_unit_price',
		'dynamic_subtotal'
	];

	protected $fillable = [
		'sale_id',
		'variant_id',
		'owner_id',
		'quantity',
		'unit_price',
		'discount',
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

	public function sale_applied_discount()
	{
		return $this->hasOne(\App\Models\Sales\SaleAppliedDiscount::class, 'sale_detail_id');
	}

	public function getDynamicUnitPriceAttribute()
	{
		if ($this->bundle_group_id) {
			return (float) ($this->bundle_price ?? $this->unit_price);
		}

		$basePrice = (float) ($this->original_price ?? $this->unit_price);
		
		if ($this->relationLoaded('sale_applied_discount') && $this->sale_applied_discount) {
			$discountAmount = (float) $this->sale_applied_discount->discount_amount;
			if ($this->quantity > 0) {
				return max(0, $basePrice - ($discountAmount / $this->quantity));
			}
		}

		return $basePrice;
	}

	public function getDynamicSubtotalAttribute()
	{
		return $this->dynamic_unit_price * $this->quantity;
	}
}
