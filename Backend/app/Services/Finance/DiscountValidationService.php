<?php

namespace App\Services\Finance;

use App\Models\Discount\Discount;
use App\Models\Finance\Giftcard;
use Illuminate\Support\Facades\DB;

class DiscountValidationService
{
    /**
     * Finds and applies the best automatic discount for a set of items.
     * Returns the validation result if a valid automatic discount is found.
     * 
     * @param float $subtotal
     * @param \Illuminate\Support\Collection|array $items
     * @param string|null $customerId
     * @param string|null $branchId
     * @return array|null
     */
    public function getBestAutomaticDiscount($subtotal, $items, $customerId = null, $branchId = null)
    {
        $automaticDiscounts = Discount::where('is_automatic', true)
            ->where('active', true)
            ->where(function($q) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', now());
            })
            ->where(function($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now());
            })
            ->get();

        $bestDiscount = null;
        $bestDiscountAmount = 0;
        $bestResult = null;

        foreach ($automaticDiscounts as $discount) {
            $result = $this->validateDiscount($discount->code, $subtotal, $items, $customerId, $branchId);
            if ($result['valid'] && $result['discount_amount'] > $bestDiscountAmount) {
                $bestDiscountAmount = $result['discount_amount'];
                $bestDiscount = $discount;
                $bestResult = $result;
            }
        }
        
        return $bestResult ?: ['valid' => false, 'message' => 'No automatic discounts applicable.'];
    }

    /**
     * Validates a code (Giftcard or Discount) against a set of items.
     * Returns an array with the validation result.
     * 
     * @param string $code
     * @param float $subtotal
     * @param \Illuminate\Support\Collection|array $items Must contain 'variant_id' and 'line_subtotal'
     * @param string|null $customerId
     * @param string|null $branchId
     * @return array
     */
    public function validateCode($code, $subtotal, $items, $customerId = null, $branchId = null)
    {
        if (!$code) {
            return ['valid' => false, 'message' => 'Código no proporcionado.'];
        }

        // 1. Check if it's a Giftcard format
        if (preg_match('/^VOX-\d{6}$/', $code)) {
            return $this->validateGiftcard($code, $subtotal);
        }

        // 2. Otherwise, treat as Discount
        return $this->validateDiscount($code, $subtotal, $items, $customerId, $branchId);
    }

    protected function validateGiftcard($code, $subtotal)
    {
        $giftcard = Giftcard::where('code', $code)->first();

        if (!$giftcard) {
            return ['valid' => false, 'message' => 'La Giftcard no existe.'];
        }

        if (!$giftcard->is_active) {
            return ['valid' => false, 'message' => 'La Giftcard está inactiva.'];
        }

        if ($giftcard->expires_at && $giftcard->expires_at->isPast()) {
            return ['valid' => false, 'message' => 'La Giftcard ha expirado.'];
        }

        if ($giftcard->current_balance <= 0) {
            return ['valid' => false, 'message' => 'La Giftcard no tiene saldo disponible.'];
        }

        $applicableAmount = min($subtotal, $giftcard->current_balance);
        $newTotal = max(0, $subtotal - $applicableAmount);

        return [
            'valid' => true,
            'type' => 'giftcard',
            'id' => $giftcard->id,
            'code' => $giftcard->code,
            'original_total' => $subtotal,
            'discount_amount' => $applicableAmount,
            'new_total' => $newTotal,
            'message' => 'Giftcard aplicada correctamente.',
            'remaining_balance' => $giftcard->current_balance - $applicableAmount
        ];
    }

    protected function validateDiscount($code, $subtotal, $items, $customerId, $branchId)
    {
        $discount = Discount::where(function($q) use ($code) {
                $q->where('code', $code);
                if (\Illuminate\Support\Str::isUuid($code)) {
                    $q->orWhere('id', $code);
                }
            })
            ->where('active', true)
            ->first();

        if (!$discount) {
            return ['valid' => false, 'message' => 'Cupón de descuento no válido o inactivo.'];
        }

        // Check expiration
        if ($discount->end_date && $discount->end_date->isPast()) {
            return ['valid' => false, 'message' => 'El cupón ha expirado.'];
        }

        if ($discount->start_date && $discount->start_date->isFuture()) {
            return ['valid' => false, 'message' => 'El cupón aún no es válido.'];
        }

        // Check usage limit
        if ($discount->usage_limit) {
            $pendingCartUses = \App\Models\Sales\Cart::where('discount_id', $discount->id)
                ->whereIn('status', ['active', 'ordered'])
                ->where(function($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->count();
                
            if (($discount->used_count + $pendingCartUses) >= $discount->usage_limit) {
                return ['valid' => false, 'message' => 'El cupón ha alcanzado su límite de usos.'];
            }
        }

        // Check per-user usage limit
        if ($discount->usage_limit_per_customer) {
            if (!$customerId) {
                return ['valid' => false, 'message' => 'Este cupón es exclusivo para clientes registrados.'];
            }

            $userUsageCount = \App\Models\Sales\Sale::where('discount_id', $discount->id)
                ->where('customer_id', $customerId)
                ->whereNotIn('status', ['cancelled'])
                ->count();
                
            $pendingUserCartUses = \App\Models\Sales\Cart::where('discount_id', $discount->id)
                ->where('customer_id', $customerId)
                ->where('status', 'active')
                ->where(function($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->count();
                
            if (($userUsageCount + $pendingUserCartUses) >= $discount->usage_limit_per_customer) {
                return ['valid' => false, 'message' => 'Has alcanzado el límite de usos permitidos para este cupón.'];
            }
        }

        // Validate Branch
        if ($branchId && $discount->branches()->exists()) {
            if (!$discount->branches()->where('branches.id', $branchId)->exists()) {
                return ['valid' => false, 'message' => 'El cupón no es válido para esta sucursal.'];
            }
        }

        // Validate Customer
        if ($discount->customers()->exists()) {
            if (!$customerId) {
                return ['valid' => false, 'message' => 'Este cupón es exclusivo para clientes registrados.'];
            }
            if (!$discount->customers()->where('customers.id', $customerId)->exists()) {
                return ['valid' => false, 'message' => 'El cupón no aplica para este cliente.'];
            }
        }

        // Retrieve valid item variations
        $validItemsSubtotal = 0;
        
        $discountCategories = $discount->categories()->pluck('categories.id')->toArray();
        $discountBrands = $discount->brands()->pluck('brands.id')->toArray();
        $discountProducts = $discount->products()->pluck('products.id')->toArray();
        $discountVariants = $discount->variants()->pluck('product_variants.id')->toArray();
        
        $hasItemRestrictions = !empty($discountCategories) || !empty($discountBrands) || !empty($discountProducts) || !empty($discountVariants);

        foreach ($items as $item) {
            // Support arrays or objects
            $variantId = is_array($item) ? $item['variant_id'] : $item->variant_id;
            $lineSubtotal = is_array($item) ? $item['line_subtotal'] : $item->subtotal; // In Cart it's line_subtotal, in SaleDetail it's subtotal
            
            $variant = \App\Models\Catalog\ProductVariant::with('product')->find($variantId);
            if (!$variant) continue;

            $isBundleItem = is_array($item) ? !empty($item['bundle_group_id']) : !empty($item->bundle_group_id);
            if ($isBundleItem) {
                continue; // Skip bundle items for global discounts
            }

            // Exclude items that already have automatic individual discounts
            $activeAutomaticDiscounts = collect();
            if (method_exists($this, 'getActiveDiscountsForProduct')) {
                $activeAutomaticDiscounts = $this->getActiveDiscountsForProduct($variant->product);
            }
            $hasIndividualDiscount = false;
            foreach ($activeAutomaticDiscounts as $autoDiscount) {
                $autoVars = $autoDiscount->variants()->pluck('product_variants.id')->toArray();
                if (empty($autoVars) || in_array($variant->id, $autoVars)) {
                    $hasIndividualDiscount = true;
                    break;
                }
            }
            if ($hasIndividualDiscount) {
                continue; // Skip this item for global discount
            }

            $itemValid = true;
            
            if ($hasItemRestrictions) {
                $itemValid = false;
                
                if (in_array($variant->id, $discountVariants)) {
                    $itemValid = true;
                } elseif (in_array($variant->product_id, $discountProducts)) {
                    $itemValid = true;
                } elseif (in_array($variant->product->brand_id, $discountBrands)) {
                    $itemValid = true;
                } elseif (in_array($variant->product->category_id, $discountCategories)) {
                    $itemValid = true;
                }
            }

            if ($itemValid) {
                $validItemsSubtotal += $lineSubtotal;
            }
        }

        if ($validItemsSubtotal <= 0) {
            return ['valid' => false, 'message' => 'El cupón no aplica para los productos seleccionados.'];
        }

        // Check minimum purchase amount
        if ($discount->min_purchase_amount && $validItemsSubtotal < $discount->min_purchase_amount) {
            return ['valid' => false, 'message' => 'No se alcanzó el monto mínimo ('. $discount->min_purchase_amount .' Bs) para este cupón.'];
        }

        // Check minimum quantity
        if ($discount->min_quantity) {
            $validItemsQty = 0;
            foreach ($items as $item) {
                $variantId = is_array($item) ? $item['variant_id'] : $item->variant_id;
                $qty = is_array($item) ? ($item['quantity'] ?? 1) : ($item->quantity ?? 1);
                $variant = \App\Models\Catalog\ProductVariant::with('product')->find($variantId);
                if (!$variant) continue;

                $itemValid = true;
                if ($hasItemRestrictions) {
                    $itemValid = false;
                    if (in_array($variant->id, $discountVariants)) $itemValid = true;
                    elseif (in_array($variant->product_id, $discountProducts)) $itemValid = true;
                    elseif (in_array($variant->product->brand_id, $discountBrands)) $itemValid = true;
                    elseif (in_array($variant->product->category_id, $discountCategories)) $itemValid = true;
                }
                if ($itemValid) $validItemsQty += $qty;
            }
            if ($validItemsQty < $discount->min_quantity) {
                return ['valid' => false, 'message' => 'Se requieren al menos ' . $discount->min_quantity . ' unidades para este cupón.'];
            }
        }

        // Calculate discount amount based on VALID items
        $discountAmount = 0;
        if ($discount->type === 'percentage') {
            $discountAmount = $validItemsSubtotal * ($discount->value / 100);
        } else {
            // Fixed discount is applied entirely as long as it does not exceed the valid subtotal
            $discountAmount = $discount->value;
        }

        if ($discount->max_discount_amount) {
            $discountAmount = min($discountAmount, $discount->max_discount_amount);
        }

        $discountAmount = min($discountAmount, $validItemsSubtotal); // Can't discount more than what the valid items cost
        
        $newTotal = max(0, $subtotal - $discountAmount);

        return [
            'valid' => true,
            'message' => 'Descuento aplicado exitosamente.',
            'type' => 'discount',
            'id' => $discount->id,
            'code' => $discount->code ?: $discount->id,
            'discount_amount' => $discountAmount,
            'original_total' => $subtotal,
            'new_total' => $newTotal
        ];
    }

    /**
     * Prorates a total discount amount across a list of items by weight (line_subtotal / total).
     * Returns an array of [ variant_id => prorated_discount ] pairs.
     * The last item absorbs any rounding difference.
     *
     * @param array $items  Each item must have 'variant_id' and 'line_subtotal'
     * @param float $totalDiscount
     * @param float $subtotal
     * @return array [ variant_id => float ]
     */
    public function prorateDiscountToItems(array $items, float $totalDiscount, float $subtotal): array
    {
        if ($totalDiscount <= 0 || $subtotal <= 0) {
            return [];
        }

        $result = [];
        $remaining = $totalDiscount;
        $count = count($items);

        foreach ($items as $i => $item) {
            $variantId = is_array($item) ? $item['variant_id'] : $item->variant_id;
            $lineSubtotal = is_array($item) ? ($item['line_subtotal'] ?? 0) : ($item->line_subtotal ?? $item->subtotal ?? 0);

            if ($i === $count - 1) {
                $itemDiscount = $remaining;
            } else {
                $weight = $subtotal > 0 ? $lineSubtotal / $subtotal : 0;
                $itemDiscount = round($totalDiscount * $weight, 2);
                $remaining -= $itemDiscount;
            }

            $result[$variantId] = max(0, $itemDiscount);
        }

        return $result;
    }
    /**
     * Gets all active automatic discounts that apply to a specific product.
     * 
     * @param \App\Models\Catalog\Product $product
     * @return \Illuminate\Support\Collection
     */
    public function getActiveDiscountsForProduct($product)
    {
        $automaticDiscounts = Discount::where('is_automatic', true)
            ->where('active', true)
            ->where(function($q) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', now());
            })
            ->where(function($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now());
            })
            ->get();

        $applicableDiscounts = collect();

        foreach ($automaticDiscounts as $discount) {
            // Check usage limits
            if ($discount->usage_limit && $discount->used_count >= $discount->usage_limit) {
                continue;
            }

            // Exclude discounts that require a registered customer
            if ($discount->usage_limit_per_customer || $discount->customers()->exists()) {
                continue;
            }

            $discountCategories = $discount->categories()->pluck('categories.id')->toArray();
            $discountBrands = $discount->brands()->pluck('brands.id')->toArray();
            $discountProducts = $discount->products()->pluck('products.id')->toArray();
            $discountVariants = $discount->variants()->pluck('product_variants.id')->toArray();
            
            $hasItemRestrictions = !empty($discountCategories) || !empty($discountBrands) || !empty($discountProducts) || !empty($discountVariants);

            if (!$hasItemRestrictions) {
                // It applies to all products
                $applicableDiscounts->push($discount);
                continue;
            }

            // Check if product matches restrictions
            $matches = false;
            if (in_array($product->id, $discountProducts)) {
                $matches = true;
            } elseif (in_array($product->brand_id, $discountBrands)) {
                $matches = true;
            } elseif (in_array($product->category_id, $discountCategories)) {
                $matches = true;
            } elseif (!empty($discountVariants)) {
                // Check if any of the product variants are in the discount variants
                $productVariantIds = $product->product_variants()->pluck('id')->toArray();
                if (!empty(array_intersect($productVariantIds, $discountVariants))) {
                    $matches = true;
                }
            }

            if ($matches) {
                $applicableDiscounts->push($discount);
            }
        }

        return $applicableDiscounts;
    }

}
