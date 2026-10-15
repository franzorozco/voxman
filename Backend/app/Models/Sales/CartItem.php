<?php

namespace App\Models\Sales;

use App\Models\Base\CartItem as BaseCartItem;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CartItem extends BaseCartItem
{
	use HasUuids;
	protected $fillable = [
		'cart_id',
		'variant_id',
		'quantity',
		'discount_amount',
		'applied_discount_id',
		'discount_label',
		// Bundle pricing fields
		'override_price',   // precio preferencial del conjunto que el cliente paga
		'original_price',   // precio normal del item en product_variants al momento de la compra
		'bundle_group_id',  // agrupa items del mismo conjunto en el mismo pedido
	];

	protected $casts = [
		'quantity'       => 'integer',
		'override_price' => 'decimal:2',
		'original_price' => 'decimal:2',
		'discount_amount'=> 'decimal:2',
	];

	protected $appends = ['dynamic_unit_price', 'dynamic_subtotal'];

	public function variant()
	{
		return $this->belongsTo(\App\Models\Catalog\ProductVariant::class, 'variant_id')->withTrashed();
	}

	public function appliedDiscount()
	{
		return $this->belongsTo(\App\Models\Discount\Discount::class, 'applied_discount_id');
	}

	public function getDynamicUnitPriceAttribute()
	{
		if (isset($this->attributes['calculated_unit_price'])) {
			return (float) $this->attributes['calculated_unit_price'];
		}

		$variant = $this->relationLoaded('variant')
			? $this->variant
			: ($this->relationLoaded('product_variant') ? $this->product_variant : ($this->variant ?? $this->product_variant));

		$price = (float) ($variant->price ?? $this->original_price ?? 0);

		if ($this->override_price !== null) {
			return (float) $this->override_price;
		}

		if (!empty($this->applied_discount_id)) {
			$customerId = ($this->relationLoaded('cart') && $this->cart) ? $this->cart->customer_id : null;
			$discountService = app(\App\Services\Finance\DiscountValidationService::class);
			$res = $discountService->validateItemDiscount($this->applied_discount_id, $variant, $customerId);
			if ($res['valid']) {
				$d = $res['discount'];
				if ($d->type === 'percentage') {
					$discVal = round($price * ($d->value / 100), 2);
					return max(0, round($price - $discVal, 2));
				} else {
					$discVal = min($price, (float) $d->value);
					return max(0, round($price - $discVal, 2));
				}
			}
		}

		return $price;
	}

	public function getDynamicSubtotalAttribute()
	{
		if (isset($this->attributes['calculated_subtotal'])) {
			return (float) $this->attributes['calculated_subtotal'];
		}
		return round($this->dynamic_unit_price * (int) $this->quantity, 2);
	}
}
