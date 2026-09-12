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
		$price = $this->variant->price ?? 0;
		if ($this->override_price !== null) {
			return (float) $this->override_price;
		}
		if ($this->appliedDiscount) {
			if ($this->appliedDiscount->type === 'percentage') {
				return $price - ($price * $this->appliedDiscount->value / 100);
			} else {
				return max(0, $price - $this->appliedDiscount->value);
			}
		}
		return $price;
	}

	public function getDynamicSubtotalAttribute()
	{
		return $this->dynamic_unit_price * $this->quantity;
	}
}
