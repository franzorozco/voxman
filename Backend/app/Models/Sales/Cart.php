<?php

namespace App\Models\Sales;

use App\Models\Base\Cart as BaseCart;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Cart extends BaseCart
{
	use HasUuids;
	protected $fillable = [
		'customer_id',
		'reference_number',
		'status',
		'source',
		'delivery_details',
		'expires_at',
		'updated_at',
		'discount_id',
		'total_discount',
        'guest_id'
	];

	protected $appends = ['total_amount', 'dynamic_subtotal', 'dynamic_global_discount'];

	protected $casts = [
		'delivery_details' => 'array',
		'expires_at' => 'datetime'
	];

	public function guest()
	{
		return $this->belongsTo(\App\Models\Base\Guest::class, 'guest_id');
	}

	public function discount()
	{
		return $this->belongsTo(\App\Models\Discount\Discount::class, 'discount_id');
	}

	public function getDynamicSubtotalAttribute()
	{
		if (isset($this->attributes['subtotal_calculated'])) {
			return (float) $this->attributes['subtotal_calculated'];
		}

		return round((float) $this->items->sum(function ($item) {
			return $item->dynamic_subtotal;
		}), 2);
	}

    public function getDynamicGlobalDiscountAttribute()
    {
        if (isset($this->attributes['global_discount_calculated'])) {
            return (float) $this->attributes['global_discount_calculated'];
        }

        if (!$this->discount_id && (float) ($this->total_discount ?? 0) <= 0) {
            return 0.0;
        }

        $subtotal = $this->dynamic_subtotal;
        if ($subtotal <= 0) {
            return 0.0;
        }

        if ($this->discount_id && $this->discount) {
            $discountService = app(\App\Services\Finance\DiscountValidationService::class);
            $itemsForValidation = $this->items->map(function ($it) use ($discountService) {
                $variant = $it->relationLoaded('variant')
                    ? $it->variant
                    : ($it->relationLoaded('product_variant') ? $it->product_variant : ($it->variant ?? $it->product_variant));
                $hasActiveItemDiscount = false;
                if (!empty($it->applied_discount_id)) {
                    $res = $discountService->validateItemDiscount($it->applied_discount_id, $variant, $this->customer_id);
                    $hasActiveItemDiscount = !empty($res['valid']);
                }
                return [
                    'variant_id' => $it->variant_id,
                    'variant' => $variant,
                    'line_subtotal' => $it->dynamic_subtotal,
                    'quantity' => (int) $it->quantity,
                    'applied_discount_id' => $hasActiveItemDiscount ? $it->applied_discount_id : null,
                    'discount_label' => $hasActiveItemDiscount ? $it->discount_label : null,
                    'bundle_group_id' => $it->bundle_group_id,
                ];
            })->toArray();

            $codeOrId = $this->discount->code ?: $this->discount->id;
            $result = $discountService->validateCode(
                $codeOrId,
                $subtotal,
                $itemsForValidation,
                $this->customer_id,
                null,
                $this->id
            );

            if (!empty($result['valid'])) {
                return round((float) $result['discount_amount'], 2);
            }

            return 0.0;
        }

        return min($subtotal, round((float) ($this->total_discount ?? 0), 2));
    }

	public function getTotalAmountAttribute()
	{
		if (isset($this->attributes['total_amount_calculated'])) {
			return (float) $this->attributes['total_amount_calculated'];
		}

		$subtotal = $this->dynamic_subtotal;
		$discount = $this->dynamic_global_discount;
		return max(0, round($subtotal - $discount, 2));
	}
}


