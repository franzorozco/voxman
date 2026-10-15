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
    public function validateCode($code, $subtotal, $items, $customerId = null, $branchId = null, $excludeCartId = null)
    {
        if (!$code) {
            return ['valid' => false, 'message' => 'Código no proporcionado.'];
        }

        // 1. Check if it's a Giftcard format
        if (preg_match('/^VOX-\d{6}$/', $code)) {
            return $this->validateGiftcard($code, $subtotal);
        }

        // 2. Otherwise, treat as Discount
        return $this->validateDiscount($code, $subtotal, $items, $customerId, $branchId, $excludeCartId);
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

        $applicableAmount = round(min((float) $subtotal, (float) $giftcard->current_balance), 2);
        $newTotal = max(0, round((float) $subtotal - $applicableAmount, 2));

        return [
            'valid' => true,
            'type' => 'giftcard',
            'id' => $giftcard->id,
            'code' => $giftcard->code,
            'original_total' => round((float) $subtotal, 2),
            'discount_amount' => $applicableAmount,
            'new_total' => $newTotal,
            'message' => 'Giftcard aplicada correctamente.',
            'remaining_balance' => round((float) $giftcard->current_balance - $applicableAmount, 2)
        ];
    }

    protected function validateDiscount($code, $subtotal, $items, $customerId, $branchId, $excludeCartId = null)
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
                ->when($excludeCartId, function ($q) use ($excludeCartId) {
                    $q->where('id', '!=', $excludeCartId);
                })
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
                ->when($excludeCartId, function ($q) use ($excludeCartId) {
                    $q->where('id', '!=', $excludeCartId);
                })
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
            $variantId = is_array($item) ? ($item['variant_id'] ?? null) : ($item->variant_id ?? null);
            $lineSubtotal = is_array($item) ? ($item['line_subtotal'] ?? 0) : ($item->line_subtotal ?? $item->subtotal ?? 0);
            
            $variant = (is_array($item) && !empty($item['variant']))
                ? $item['variant']
                : ((!is_array($item) && !empty($item->variant))
                    ? $item->variant
                    : ($variantId ? \App\Models\Catalog\ProductVariant::with('product')->find($variantId) : null));
            if (!$variant) continue;

            $isBundleItem = is_array($item) ? !empty($item['bundle_group_id']) : !empty($item->bundle_group_id);
            if ($isBundleItem) {
                continue; // Skip bundle items for global discounts
            }

            // Exclude items that already have an explicit individual discount applied
            $hasIndividualDiscount = is_array($item) 
                ? (!empty($item['applied_discount_id']) || !empty($item['discount_label'])) 
                : (!empty($item->applied_discount_id) || !empty($item->discount_label));
                
            if ($hasIndividualDiscount) {
                continue; // Skip this item for global discount
            }

            $itemValid = true;
            
            if ($hasItemRestrictions) {
                $itemValid = false;
                $product = $variant->product ?? null;
                
                if (in_array($variant->id, $discountVariants)) {
                    $itemValid = true;
                } elseif (in_array($variant->product_id, $discountProducts)) {
                    $itemValid = true;
                } elseif ($product && in_array($product->brand_id, $discountBrands)) {
                    $itemValid = true;
                } elseif ($product && in_array($product->category_id, $discountCategories)) {
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
                $variantId = is_array($item) ? ($item['variant_id'] ?? null) : ($item->variant_id ?? null);
                $qty = is_array($item) ? ($item['quantity'] ?? 1) : ($item->quantity ?? 1);
                $variant = (is_array($item) && !empty($item['variant']))
                    ? $item['variant']
                    : ((!is_array($item) && !empty($item->variant))
                        ? $item->variant
                        : ($variantId ? \App\Models\Catalog\ProductVariant::with('product')->find($variantId) : null));
                if (!$variant) continue;

                $isBundleItem = is_array($item) ? !empty($item['bundle_group_id']) : !empty($item->bundle_group_id);
                if ($isBundleItem) continue;

                $hasIndividualDiscount = is_array($item) 
                    ? (!empty($item['applied_discount_id']) || !empty($item['discount_label'])) 
                    : (!empty($item->applied_discount_id) || !empty($item->discount_label));
                if ($hasIndividualDiscount) continue;

                $itemValid = true;
                if ($hasItemRestrictions) {
                    $itemValid = false;
                    $product = $variant->product ?? null;
                    if (in_array($variant->id, $discountVariants)) $itemValid = true;
                    elseif (in_array($variant->product_id, $discountProducts)) $itemValid = true;
                    elseif ($product && in_array($product->brand_id, $discountBrands)) $itemValid = true;
                    elseif ($product && in_array($product->category_id, $discountCategories)) $itemValid = true;
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
            $discountAmount = round($validItemsSubtotal * ($discount->value / 100), 2);
        } else {
            // Fixed discount is applied entirely as long as it does not exceed the valid subtotal
            $discountAmount = (float) $discount->value;
        }

        if ($discount->max_discount_amount) {
            $discountAmount = min($discountAmount, (float) $discount->max_discount_amount);
        }

        $discountAmount = round(min($discountAmount, $validItemsSubtotal), 2); // Can't discount more than what the valid items cost
        
        $newTotal = max(0, round($subtotal - $discountAmount, 2));

        return [
            'valid' => true,
            'message' => 'Descuento aplicado exitosamente.',
            'type' => 'discount',
            'discount' => $discount,
            'id' => $discount->id,
            'name' => $discount->name,
            'code' => $discount->code ?: $discount->id,
            'discount_amount' => $discountAmount,
            'original_total' => round((float) $subtotal, 2),
            'new_total' => $newTotal
        ];
    }

    /**
     * Prorates a total discount amount across a list of items by weight (line_subtotal / total).
     * Returns an array of [ index => prorated_discount ] pairs.
     * The last eligible item absorbs any rounding difference.
     *
     * @param array $items  Each item must have 'line_subtotal' (and optionally 'variant_id' / 'variant')
     * @param float $totalDiscount
     * @param float $subtotal
     * @param \App\Models\Discount\Discount|null $discount
     * @return array [ index => float ]
     */
    public function prorateDiscountToItems(array $items, float $totalDiscount, float $subtotal, $discount = null): array
    {
        if ($totalDiscount <= 0 || $subtotal <= 0 || empty($items)) {
            return array_fill(0, count($items), 0);
        }

        $result = array_fill(0, count($items), 0);

        $discountCategories = [];
        $discountBrands = [];
        $discountProducts = [];
        $discountVariants = [];
        $hasItemRestrictions = false;

        if ($discount instanceof Discount) {
            $discountCategories = $discount->categories()->pluck('categories.id')->toArray();
            $discountBrands = $discount->brands()->pluck('brands.id')->toArray();
            $discountProducts = $discount->products()->pluck('products.id')->toArray();
            $discountVariants = $discount->variants()->pluck('product_variants.id')->toArray();
            $hasItemRestrictions = !empty($discountCategories) || !empty($discountBrands) || !empty($discountProducts) || !empty($discountVariants);
        }

        // Find eligible items and their subtotal sum
        $eligibleIndexes = [];
        $eligibleSubtotal = 0;

        foreach ($items as $i => $item) {
            $isBundleItem = is_array($item) ? !empty($item['bundle_group_id']) : !empty($item->bundle_group_id);
            if ($isBundleItem) continue;

            $hasNativeDiscount = is_array($item) 
                ? (!empty($item['applied_discount_id']) || !empty($item['discount_label'])) 
                : (!empty($item->applied_discount_id) || !empty($item->discount_label));
            if ($hasNativeDiscount) continue;

            if ($hasItemRestrictions) {
                $variantId = is_array($item) ? ($item['variant_id'] ?? null) : ($item->variant_id ?? null);
                $variant = (is_array($item) && !empty($item['variant']))
                    ? $item['variant']
                    : ((!is_array($item) && !empty($item->variant))
                        ? $item->variant
                        : ($variantId ? \App\Models\Catalog\ProductVariant::with('product')->find($variantId) : null));
                if (!$variant) continue;

                $product = $variant->product ?? null;
                $matches = false;
                if (in_array($variant->id, $discountVariants)) $matches = true;
                elseif (in_array($variant->product_id, $discountProducts)) $matches = true;
                elseif ($product && in_array($product->brand_id, $discountBrands)) $matches = true;
                elseif ($product && in_array($product->category_id, $discountCategories)) $matches = true;

                if (!$matches) continue;
            }

            $lineSubtotal = is_array($item) ? ($item['line_subtotal'] ?? 0) : ($item->line_subtotal ?? $item->subtotal ?? 0);
            if ($lineSubtotal <= 0) continue;
            
            $eligibleIndexes[] = $i;
            $eligibleSubtotal += $lineSubtotal;
        }

        if (empty($eligibleIndexes) || $eligibleSubtotal <= 0) {
            return $result;
        }

        $remaining = round($totalDiscount, 2);
        $count = count($eligibleIndexes);

        foreach ($eligibleIndexes as $idx => $i) {
            $item = $items[$i];
            $lineSubtotal = is_array($item) ? ($item['line_subtotal'] ?? 0) : ($item->line_subtotal ?? $item->subtotal ?? 0);

            if ($idx === $count - 1) {
                $itemDiscount = round($remaining, 2);
            } else {
                $weight = $eligibleSubtotal > 0 ? $lineSubtotal / $eligibleSubtotal : 0;
                $itemDiscount = round($totalDiscount * $weight, 2);
                $remaining = round($remaining - $itemDiscount, 2);
            }

            $result[$i] = max(0, $itemDiscount);
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

    /**
     * Valida en tiempo real si un descuento aplicado a un item/variable sigue siendo válido.
     * 
     * @param string $discountId
     * @param \App\Models\Catalog\ProductVariant|null $variant
     * @param string|null $customerId
     * @return array
     */
    public function validateItemDiscount($discountId, $variant = null, $customerId = null): array
    {
        if (!$discountId) {
            return ['valid' => false, 'message' => 'Descuento no especificado.'];
        }

        $discount = Discount::find($discountId);
        if (!$discount) {
            return ['valid' => false, 'message' => 'El descuento ha sido eliminado del sistema.'];
        }

        if (!$discount->active) {
            return ['valid' => false, 'message' => 'El descuento ya no se encuentra activo.'];
        }

        if ($discount->end_date && $discount->end_date->isPast()) {
            return ['valid' => false, 'message' => 'El descuento ha expirado.'];
        }

        if ($discount->start_date && $discount->start_date->isFuture()) {
            return ['valid' => false, 'message' => 'El descuento aún no se encuentra vigente.'];
        }

        // Límites de uso
        if ($discount->usage_limit && $discount->used_count >= $discount->usage_limit) {
            return ['valid' => false, 'message' => 'El descuento ha alcanzado su límite de usos global.'];
        }

        if ($discount->usage_limit_per_customer && $customerId) {
            $userUsageCount = \App\Models\Sales\Sale::where('discount_id', $discount->id)
                ->where('customer_id', $customerId)
                ->whereNotIn('status', ['cancelled'])
                ->count();
            if ($userUsageCount >= $discount->usage_limit_per_customer) {
                return ['valid' => false, 'message' => 'Límite de usos por cliente alcanzado.'];
            }
        }

        // Restricciones de items (si el descuento está restringido a ciertas categorías, marcas, productos o variantes)
        if ($variant) {
            $discountCategories = $discount->categories()->pluck('categories.id')->toArray();
            $discountBrands = $discount->brands()->pluck('brands.id')->toArray();
            $discountProducts = $discount->products()->pluck('products.id')->toArray();
            $discountVariants = $discount->variants()->pluck('product_variants.id')->toArray();

            $hasItemRestrictions = !empty($discountCategories) || !empty($discountBrands) || !empty($discountProducts) || !empty($discountVariants);

            if ($hasItemRestrictions) {
                $product = $variant->product ?? null;
                $matches = false;
                if (in_array($variant->id, $discountVariants)) {
                    $matches = true;
                } elseif ($product && in_array($product->id, $discountProducts)) {
                    $matches = true;
                } elseif ($product && in_array($product->brand_id, $discountBrands)) {
                    $matches = true;
                } elseif ($product && in_array($product->category_id, $discountCategories)) {
                    $matches = true;
                }

                if (!$matches) {
                    return ['valid' => false, 'message' => 'El producto ya no califica para este descuento.'];
                }
            }
        }

        return [
            'valid' => true,
            'discount' => $discount,
            'id' => $discount->id,
            'name' => $discount->name,
            'type' => $discount->type,
            'value' => (float) $discount->value,
            'code' => $discount->code,
        ];
    }

    /**
     * Calcula y valida en tiempo real todos los items, stock, descuentos individuales,
     * descuento global del carrito y prorrateo por item.
     * Unifica la lógica entre el Perfil (/profile), Correos a Owners y Panel Administrativo.
     *
     * @param \App\Models\Sales\Cart $cart
     * @return array
     */
    public function calculateAndValidateCart(\App\Models\Sales\Cart $cart): array
    {
        $hasStockIssues = false;
        $subtotalCalculated = 0.0;
        $itemsForValidation = [];
        $validatedItems = [];

        foreach ($cart->items as $index => $item) {
            $variant = null;
            if ($item->relationLoaded('variant')) {
                $variant = $item->variant;
            } elseif ($item->relationLoaded('product_variant')) {
                $variant = $item->product_variant;
            } else {
                $variant = $item->variant ?? $item->product_variant;
            }

            // 1. Validación de stock en tiempo real
            if (!$variant || !$variant->is_active || (method_exists($variant, 'trashed') && $variant->trashed())) {
                $stockStatus = 'unavailable';
                $stockLabel = 'No disponible';
                $availableStock = 0;
                $hasStock = false;
                $hasStockIssues = true;
            } else {
                $availableStock = $variant->relationLoaded('inventories')
                    ? (int) $variant->inventories->sum('stock')
                    : (int) $variant->inventories()->sum('stock');

                if ($availableStock <= 0) {
                    $stockStatus = 'out_of_stock';
                    $stockLabel = 'Agotado';
                    $hasStock = false;
                    $hasStockIssues = true;
                } elseif ($availableStock < $item->quantity) {
                    $stockStatus = 'insufficient';
                    $stockLabel = "Solo quedan {$availableStock} disponibles";
                    $hasStock = false;
                    $hasStockIssues = true;
                } else {
                    $stockStatus = 'in_stock';
                    $stockLabel = 'En stock';
                    $hasStock = true;
                }
            }

            // 2. Validación de precios y descuentos individuales en tiempo real
            $basePrice = (float) ($variant->price ?? $item->original_price ?? 0);
            $originalUnitPrice = (float) ($item->original_price ?: $basePrice);

            $hasActiveDiscount = false;
            $discountIsExpired = false;
            $discountExpiredReason = null;
            $discountLabel = null;
            $discountName = null;
            $discountAmountPerUnit = 0.0;
            $calculatedUnitPrice = $basePrice;

            if (!empty($item->applied_discount_id)) {
                $discountResult = $this->validateItemDiscount($item->applied_discount_id, $variant, $cart->customer_id);

                if ($discountResult['valid']) {
                    $discountObj = $discountResult['discount'];
                    if ($discountObj->type === 'percentage') {
                        $discountAmountPerUnit = round($basePrice * ($discountObj->value / 100), 2);
                        $calculatedUnitPrice = max(0, round($basePrice - $discountAmountPerUnit, 2));
                    } else {
                        $discountAmountPerUnit = min($basePrice, (float) $discountObj->value);
                        $calculatedUnitPrice = max(0, round($basePrice - $discountAmountPerUnit, 2));
                    }

                    $hasActiveDiscount = true;
                    $discountIsExpired = false;
                    $discountLabel = $item->discount_label ?: ($discountObj->type === 'percentage'
                        ? "-{$discountObj->value}%"
                        : "-Bs. " . number_format($discountObj->value, 2));
                    $discountName = $discountObj->name;
                } else {
                    $hasActiveDiscount = false;
                    $discountIsExpired = true;
                    $discountExpiredReason = $discountResult['message'] ?? 'Descuento expirado o ya no disponible';
                    $calculatedUnitPrice = $basePrice;
                }
            } elseif ($item->override_price !== null) {
                $calculatedUnitPrice = (float) $item->override_price;
                if ($originalUnitPrice > $calculatedUnitPrice && !empty($item->discount_label)) {
                    $hasActiveDiscount = true;
                    $discountLabel = $item->discount_label;
                    $discountAmountPerUnit = round($originalUnitPrice - $calculatedUnitPrice, 2);
                }
            }

            $calculatedSubtotal = round($calculatedUnitPrice * (int) $item->quantity, 2);
            $subtotalCalculated = round($subtotalCalculated + $calculatedSubtotal, 2);

            // Asignar propiedades dinámicas al modelo CartItem
            $item->stock_status = $stockStatus;
            $item->stock_label = $stockLabel;
            $item->available_stock = $availableStock;
            $item->has_stock = $hasStock;
            $item->regular_price = $basePrice;
            $item->original_unit_price = $originalUnitPrice;
            $item->calculated_unit_price = $calculatedUnitPrice;
            $item->calculated_subtotal = $calculatedSubtotal;
            $item->has_active_discount = $hasActiveDiscount;
            $item->discount_is_expired = $discountIsExpired;
            $item->discount_expired_reason = $discountExpiredReason;
            $item->discount_label = $discountLabel;
            $item->discount_name = $discountName;
            $item->discount_amount_per_unit = $discountAmountPerUnit;

            $itemsForValidation[$index] = [
                'variant_id' => $item->variant_id,
                'variant' => $variant,
                'line_subtotal' => $calculatedSubtotal,
                'quantity' => (int) $item->quantity,
                'applied_discount_id' => $hasActiveDiscount ? $item->applied_discount_id : null,
                'discount_label' => $hasActiveDiscount ? $discountLabel : null,
                'bundle_group_id' => $item->bundle_group_id,
            ];

            $validatedItems[$index] = [
                'item' => $item,
                'variant' => $variant,
                'stock_status' => $stockStatus,
                'stock_label' => $stockLabel,
                'available_stock' => $availableStock,
                'has_stock' => $hasStock,
                'regular_price' => $basePrice,
                'original_unit_price' => $originalUnitPrice,
                'calculated_unit_price' => $calculatedUnitPrice,
                'calculated_subtotal' => $calculatedSubtotal,
                'has_active_discount' => $hasActiveDiscount,
                'discount_is_expired' => $discountIsExpired,
                'discount_expired_reason' => $discountExpiredReason,
                'discount_label' => $discountLabel,
                'discount_name' => $discountName,
                'discount_amount_per_unit' => $discountAmountPerUnit,
                'prorated_global_discount' => 0.0,
                'net_line_total' => $calculatedSubtotal,
            ];
        }

        // 3. Validación en tiempo real del descuento global del carrito
        $globalDiscountCalculated = 0.0;
        $globalDiscountValid = false;
        $globalDiscountExpired = false;
        $globalDiscountError = null;
        $discountCode = null;
        $discountName = null;
        $cartDiscountObj = null;

        if ($cart->discount_id) {
            $cartDiscountObj = $cart->relationLoaded('discount')
                ? $cart->discount
                : Discount::find($cart->discount_id);
        }

        if ($cart->discount_id && $cartDiscountObj) {
            $codeOrId = $cartDiscountObj->code ?: $cartDiscountObj->id;
            $discountCode = $cartDiscountObj->code ?: ($cartDiscountObj->name ?: 'PROMO');
            $discountName = $cartDiscountObj->name;

            $globalResult = $this->validateCode(
                $codeOrId,
                $subtotalCalculated,
                $itemsForValidation,
                $cart->customer_id,
                null,
                $cart->id
            );

            if ($globalResult['valid']) {
                $globalDiscountCalculated = round((float) $globalResult['discount_amount'], 2);
                $globalDiscountValid = true;
            } else {
                $globalDiscountExpired = true;
                $globalDiscountError = $globalResult['message'] ?? 'El cupón ha expirado o ya no aplica.';
            }
        } elseif (!$cart->discount_id && (float) ($cart->total_discount ?? 0) > 0) {
            $globalDiscountCalculated = min($subtotalCalculated, round((float) $cart->total_discount, 2));
            $globalDiscountValid = $globalDiscountCalculated > 0;
            $discountCode = 'DESCUENTO';
        }

        // 4. Prorrateo del descuento global entre los items elegibles
        $proratedDiscounts = $this->prorateDiscountToItems(
            $itemsForValidation,
            $globalDiscountCalculated,
            $subtotalCalculated,
            $globalDiscountValid ? $cartDiscountObj : null
        );

        foreach ($validatedItems as $index => &$vItem) {
            $lineDiscount = round((float) ($proratedDiscounts[$index] ?? 0), 2);
            $netLineTotal = max(0, round($vItem['calculated_subtotal'] - $lineDiscount, 2));
            $vItem['prorated_global_discount'] = $lineDiscount;
            $vItem['net_line_total'] = $netLineTotal;

            $vItem['item']->prorated_global_discount = $lineDiscount;
            $vItem['item']->net_line_total = $netLineTotal;
        }
        unset($vItem);

        $totalAmountCalculated = max(0, round($subtotalCalculated - $globalDiscountCalculated, 2));

        // Asignar propiedades calculadas al modelo Cart
        $cart->has_stock_issues = $hasStockIssues;
        $cart->subtotal_calculated = $subtotalCalculated;
        $cart->global_discount_calculated = $globalDiscountCalculated;
        $cart->global_discount_valid = $globalDiscountValid;
        $cart->global_discount_expired = $globalDiscountExpired;
        $cart->global_discount_error = $globalDiscountError;
        $cart->total_amount_calculated = $totalAmountCalculated;

        return [
            'has_stock_issues' => $hasStockIssues,
            'subtotal_calculated' => $subtotalCalculated,
            'global_discount_calculated' => $globalDiscountCalculated,
            'global_discount_valid' => $globalDiscountValid,
            'global_discount_expired' => $globalDiscountExpired,
            'global_discount_error' => $globalDiscountError,
            'discount_code' => $discountCode,
            'discount_name' => $discountName,
            'total_amount_calculated' => $totalAmountCalculated,
            'items' => $validatedItems,
            'prorated_discounts' => $proratedDiscounts,
        ];
    }

    /**
     * Limpia y formatea los detalles de entrega eliminando valores "null" o "undefined".
     *
     * @param mixed $deliveryDetails
     * @return string
     */
    public function formatCleanDeliveryDetails($deliveryDetails): string
    {
        if (empty($deliveryDetails) || !is_array($deliveryDetails)) {
            return 'No especificado';
        }

        $dd = $deliveryDetails;
        $typeText = $dd['text'] ?? (($dd['type'] ?? '') === 'pickup' ? 'Recojo en sucursal' : 'Envío a domicilio');
        $address = $dd['address'] ?? '';

        $cleanPart = function ($str) {
            if (!$str) return '';
            $cleaned = preg_replace('/\b(null|undefined)\b/i', '', (string) $str);
            $cleaned = preg_replace('/\s*-\s*-\s*/', ' - ', $cleaned);
            $cleaned = preg_replace('/\s+/', ' ', $cleaned);
            return trim($cleaned, " \t\n\r\0\x0B-•,");
        };

        $cleanType = $cleanPart($typeText);
        $cleanAddr = $cleanPart($address);

        if (!$cleanType && !$cleanAddr) {
            return 'No especificado';
        }

        return trim($cleanType . ($cleanAddr ? ' - ' . $cleanAddr : ''));
    }
}
