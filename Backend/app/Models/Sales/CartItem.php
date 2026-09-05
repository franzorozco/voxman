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

	public function variant()
	{
		return $this->belongsTo(\App\Models\Catalog\ProductVariant::class, 'variant_id')->withTrashed();
	}
}
