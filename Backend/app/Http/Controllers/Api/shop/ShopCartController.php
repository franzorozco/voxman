<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use App\Models\Catalog\Product;
use App\Models\Catalog\ProductVariant;
use App\Services\Finance\DiscountValidationService;
use Illuminate\Support\Facades\Log;

class ShopCartController extends Controller
{
    private function getCartData($cartToken)
    {
        if (!$cartToken) return null;
        $cartData = Cache::get("cart:{$cartToken}");
        return $cartData ? json_decode($cartData, true) : null;
    }

    private function saveCartData($cartToken, $cartData)
    {
        // 48 hours expiration
        Cache::put("cart:{$cartToken}", json_encode($cartData), 48 * 60 * 60);
    }

    private function recalculateTotal(&$cartData)
    {
        $total = 0;
        foreach ($cartData['items'] as $item) {
            $total += ($item['price'] * $item['quantity']);
        }
        $cartData['total'] = $total;
    }

public function syncCartPrices(&$cartData)
    {
        if (empty($cartData['items'])) return false;

        // Fetch all active automatic discounts
        $automaticDiscounts = \App\Models\Discount\Discount::with(['categories', 'brands', 'products', 'variants', 'customers'])
            ->where('is_automatic', true)
            ->where('active', true)
            ->where(function($q) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', now());
            })
            ->where(function($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now());
            })
            ->get();

        $changed = false;

        foreach ($cartData['items'] as &$item) {
            // We only dynamically update prices for non-bundle items
            // (Bundles have override_price proportionally computed at the time of adding)
            if (!empty($item['bundle_group_id'])) {
                continue;
            }

            $product = \App\Models\Catalog\Product::find($item['product_id']);
            $variant = null;
            if (!empty($item['variant_id'])) {
                $variant = \App\Models\Catalog\ProductVariant::find($item['variant_id']);
            }

            if (!$product) continue;

            $basePrice = $product->base_price;
            if ($variant && $variant->price !== null) {
                $basePrice = $variant->price;
            }

            // Find best automatic discount for this item
            $bestDiscountPrice = $basePrice;
            $bestDiscountLabel = null;

            foreach ($automaticDiscounts as $discount) {
                // Ignore if usage limits exceeded or requires a specific customer
                if ($discount->usage_limit && $discount->used_count >= $discount->usage_limit) continue;
                if ($discount->usage_limit_per_customer || $discount->customers->isNotEmpty()) continue;

                $discountCategories = $discount->categories->pluck('id')->toArray();
                $discountBrands = $discount->brands->pluck('id')->toArray();
                $discountProducts = $discount->products->pluck('id')->toArray();
                $discountVariants = $discount->variants->pluck('id')->toArray();
                
                $hasItemRestrictions = !empty($discountCategories) || !empty($discountBrands) || !empty($discountProducts) || !empty($discountVariants);

                $productApplies = false;
                if (!$hasItemRestrictions) {
                    $productApplies = true;
                } elseif (in_array($product->id, $discountProducts) || in_array($product->brand_id, $discountBrands) || in_array($product->category_id, $discountCategories)) {
                    $productApplies = true;
                } elseif ($variant && in_array($variant->id, $discountVariants)) {
                    $productApplies = true;
                }

                if ($productApplies) {
                    if ($discount->type === 'percentage') {
                        $discounted = $basePrice - ($basePrice * ($discount->value / 100));
                        $currentLabel = "-" . floatval($discount->value) . "%";
                    } else {
                        $discounted = $basePrice - $discount->value;
                        $currentLabel = "-Bs " . floatval($discount->value);
                    }
                    if ($discounted < $bestDiscountPrice) {
                        $bestDiscountPrice = max(0, $discounted);
                        $bestDiscountLabel = $currentLabel;
                    }
                }
            }

            // If the price or original price changed, update the cart item
            if ((float)$item['original_price'] !== (float)$basePrice || (float)$item['price'] !== (float)$bestDiscountPrice || ($item['discount_label'] ?? null) !== $bestDiscountLabel) {
                $item['original_price'] = (float)$basePrice;
                $item['price'] = (float)$bestDiscountPrice;
                if ($bestDiscountLabel) {
                    $item['discount_label'] = $bestDiscountLabel;
                    $item['has_discount'] = true;
                } else {
                    $item['discount_label'] = null;
                    $item['has_discount'] = false;
                }
                $changed = true;
            }
        }
        unset($item);

        if ($changed) {
            $this->recalculateTotal($cartData);
        }

        return $changed;
    }

    public function show(Request $request)
    {
        $cartToken = $request->header('X-Cart-Token');
        $cartData = $this->getCartData($cartToken);

        if ($cartData) {
            $changed = $this->syncCartPrices($cartData);
            if ($changed) {
                        $this->syncCartPrices($cartData);
        $this->recalculateTotal($cartData);
        $this->syncCartPrices($cartData);
        $this->saveCartData($cartToken, $cartData);
            }
            return response()->json($cartData);
        }

        return response()->json(['items' => [], 'total' => 0]);
    }

    public function add(Request $request)
    {
        $request->validate([
            'product_id'      => 'required|string|exists:products,id',
            'variant_id'      => 'nullable|string|exists:product_variants,id',
            'quantity'        => 'required|integer|min:1',
            'color'           => 'nullable|string',
            'bundle_group_id' => 'nullable|string',
            'original_price'  => 'nullable|numeric|min:0',
            'override_price'  => 'nullable|numeric|min:0',
        ]);

        $cartToken = $request->header('X-Cart-Token');

        if (!$cartToken) {
            $cartToken = 'cart_' . Str::uuid()->toString();
            $cartData = ['items' => [], 'total' => 0];
        } else {
            $cartData = $this->getCartData($cartToken) ?? ['items' => [], 'total' => 0];
        }

        $productId     = $request->product_id;
        $variantId     = $request->variant_id;
        $quantity      = $request->quantity;
        $color         = $request->color;
        $bundleGroupId = $request->bundle_group_id;
        $originalPrice = $request->original_price;   // original price before bundle discount
        $overridePrice = $request->override_price;   // proportional bundle price to use instead

        // Load Product and Variant
        $product = Product::with(['product_images', 'attribute_value_images.attributeValue'])->find($productId);
        $variant = null;
        if ($variantId) {
            $variant = ProductVariant::with(['size', 'variant_images', 'variant_attribute_values.attribute_value.attribute'])->find($variantId);
        }

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        // Determine Name, Price, Size, Color
        $name = $product->name;
        $price = $product->base_price;
        $sizeName = null;
        $colorName = $color;
        $imageUrl = $product->cover_image;

        if ($variant) {
            if ($variant->price !== null) {
                $price = $variant->price;
            }
            if ($variant->size) {
                $sizeName = $variant->size->name;
            }
            
            // Try to extract color from variant attributes if not provided directly
            if (!$colorName && $variant->variant_attribute_values) {
                foreach ($variant->variant_attribute_values as $vav) {
                    if (strtolower($vav->attribute_value->attribute->name) === 'color') {
                        $colorName = $vav->attribute_value->value;
                    }
                }
            }
        }

        // Determine Image Logic
        $finalImage = null;

        // 1. Color Image
        if ($colorName && $product->attribute_value_images) {
            foreach ($product->attribute_value_images as $avi) {
                if ($avi->attributeValue && $avi->attributeValue->value === $colorName) {
                    $finalImage = $avi->url;
                    break;
                }
            }
        }

        // 2. Variant Image
        if (!$finalImage && $variant && $variant->variant_images && $variant->variant_images->count() > 0) {
            $finalImage = $variant->variant_images->first()->url;
        }

        // 3. Product Image
        if (!$finalImage && $product->product_images && $product->product_images->count() > 0) {
            $finalImage = $product->product_images->first()->url;
        }

        // 4. Cover Image
        if (!$finalImage) {
            $finalImage = $product->cover_image;
        }

        $imageUrl = $finalImage;

        $discountAmount = 0;
        $discountLabel = null;
        $appliedDiscountId = null;

        // Apply automatic discount if not a bundle
        if ($overridePrice === null) {
            $discountService = app(DiscountValidationService::class);
            $activeDiscounts = $discountService->getActiveDiscountsForProduct($product);
            foreach ($activeDiscounts as $discount) {
                $appliesToVariant = true;
                $discountVariants = $discount->variants()->pluck('product_variants.id')->toArray();
                if (!empty($discountVariants) && $variant) {
                    $appliesToVariant = in_array($variant->id, $discountVariants);
                }

                if ($appliesToVariant) {
                    $amount = 0;
                    if ($discount->type === 'percentage') {
                        $amount = $price * ($discount->value / 100);
                        $label = "-".floatval($discount->value)."%";
                    } else {
                        $amount = $discount->value;
                        $label = "-Bs ".floatval($discount->value);
                    }

                    if ($discount->max_discount_amount) {
                        $amount = min($amount, $discount->max_discount_amount);
                    }
                    $amount = min($amount, $price);

                    if ($amount > $discountAmount) {
                        $discountAmount = $amount;
                        $discountLabel = $label;
                        $appliedDiscountId = $discount->id;
                    }
                }
            }
        }

        // Apply bundle override price if provided
        if ($overridePrice !== null) {
            $price = $overridePrice;
        } else if ($discountAmount > 0) {
            $price = max(0, $price - $discountAmount);
        }

        // The stored original_price: if explicitly provided use it, else the natural price
        $storedOriginalPrice = ($originalPrice !== null) ? (float)$originalPrice : (float)($price + $discountAmount);

        // Check if item already exists
        $foundIndex = -1;
        foreach ($cartData['items'] as $index => $item) {
            $itemBundleId = isset($item['bundle_group_id']) ? $item['bundle_group_id'] : null;
            if ($item['product_id'] == $productId && $item['variant_id'] == $variantId && $itemBundleId == $bundleGroupId) {
                $foundIndex = $index;
                break;
            }
        }

        if ($foundIndex >= 0) {
            $cartData['items'][$foundIndex]['quantity'] += $quantity;
        } else {
            $cartData['items'][] = [
                'id'              => Str::uuid()->toString(),
                'product_id'      => $productId,
                'variant_id'      => $variantId,
                'name'            => $name,
                'price'           => (float)$price,
                'original_price'  => $storedOriginalPrice,
                'override_price'  => ($price != $storedOriginalPrice) ? (float)$price : null,
                'bundle_group_id' => $bundleGroupId,
                'quantity'        => $quantity,
                'size'            => $sizeName,
                'color'           => $colorName,
                'image'           => $imageUrl,
                'discount_label'  => $discountLabel,
                'applied_discount_id' => $appliedDiscountId
            ];
        }

        $this->recalculateTotal($cartData);
                $this->syncCartPrices($cartData);
        $this->recalculateTotal($cartData);
        $this->syncCartPrices($cartData);
        $this->saveCartData($cartToken, $cartData);

        return response()->json([
            'cart_token' => $cartToken,
            'cart' => $cartData
        ]);
    }

    public function addBundle(Request $request)
    {
        $request->validate([
            'bundle_id' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'items' => 'required|array',
            'items.*.product_id' => 'required|string',
            'items.*.variant_id' => 'nullable|string',
            'items.*.color' => 'nullable|string',
        ]);

        $bundleId = $request->bundle_id;
        $quantity = $request->quantity;
        $items = $request->items;

        $bundle = Product::find($bundleId);
        if (!$bundle || !$bundle->is_bundle) {
            return response()->json(['error' => 'Conjunto no encontrado'], 404);
        }

        $bundlePrice = $bundle->base_price;
        $bundleGroupId = Str::uuid()->toString();

        $cartToken = $request->header('X-Cart-Token') ?: Str::uuid()->toString();
        $cartData = $this->getCartData($cartToken) ?: ['total' => 0, 'items' => []];

        // For proportional pricing (optional)
        // If we want the bundle total price to be split among items, we can calculate total original price first
        $totalOriginalPrice = 0;
        $processedItems = [];

        foreach ($items as $itemReq) {
            $product = Product::with(['product_images', 'attribute_value_images.attributeValue'])->find($itemReq['product_id']);
            $variant = null;
            if (!empty($itemReq['variant_id'])) {
                $variant = ProductVariant::with(['size', 'variant_images', 'variant_attribute_values.attribute_value.attribute'])->find($itemReq['variant_id']);
            }

            if (!$product) continue;

            $price = $product->base_price;
            $sizeName = null;
            $colorName = $itemReq['color'] ?? null;
            
            if ($variant) {
                if ($variant->price !== null) $price = $variant->price;
                if ($variant->size) $sizeName = $variant->size->name;
                
                if (!$colorName && $variant->variant_attribute_values) {
                    foreach ($variant->variant_attribute_values as $vav) {
                        if (strtolower($vav->attribute_value->attribute->name) === 'color') {
                            $colorName = $vav->attribute_value->value;
                        }
                    }
                }
            }

            $totalOriginalPrice += $price;

            $finalImage = null;
            if ($colorName && $product->attribute_value_images) {
                foreach ($product->attribute_value_images as $avi) {
                    if ($avi->attributeValue && $avi->attributeValue->value === $colorName) {
                        $finalImage = $avi->url;
                        break;
                    }
                }
            }
            if (!$finalImage && $variant && $variant->variant_images && $variant->variant_images->count() > 0) {
                $finalImage = $variant->variant_images->first()->url;
            }
            if (!$finalImage && $product->product_images && $product->product_images->count() > 0) {
                $finalImage = $product->product_images->first()->url;
            }
            if (!$finalImage) $finalImage = $product->cover_image;

            $processedItems[] = [
                'product_id' => $product->id,
                'variant_id' => $variant ? $variant->id : null,
                'name' => $product->name,
                'original_price' => (float)$price,
                'size' => $sizeName,
                'color' => $colorName,
                'image' => $finalImage
            ];
        }

        // Add to cart with distributed override price
        $remainingBundlePrice = (float)$bundlePrice;
        $itemCount = count($processedItems);

        foreach ($processedItems as $index => $pItem) {
            // Proportional split
            if ($totalOriginalPrice > 0) {
                $ratio = $pItem['original_price'] / $totalOriginalPrice;
                $overridePrice = round($bundlePrice * $ratio, 2);
            } else {
                $overridePrice = round($bundlePrice / $itemCount, 2);
            }

            // Adjust last item to avoid rounding errors
            if ($index === $itemCount - 1) {
                $overridePrice = round($remainingBundlePrice, 2);
            } else {
                $remainingBundlePrice -= $overridePrice;
            }

            $cartData['items'][] = [
                'id'              => Str::uuid()->toString(),
                'product_id'      => $pItem['product_id'],
                'variant_id'      => $pItem['variant_id'],
                'name'            => $pItem['name'],
                'price'           => (float)$overridePrice,
                'original_price'  => $pItem['original_price'],
                'override_price'  => (float)$overridePrice,
                'bundle_group_id' => $bundleGroupId,
                'quantity'        => $quantity,
                'size'            => $pItem['size'],
                'color'           => $pItem['color'],
                'image'           => $pItem['image'],
                'bundle_name'     => $bundle->name // helpful for display
            ];
        }

        $this->recalculateTotal($cartData);
                $this->syncCartPrices($cartData);
        $this->recalculateTotal($cartData);
        $this->syncCartPrices($cartData);
        $this->saveCartData($cartToken, $cartData);

        return response()->json([
            'cart_token' => $cartToken,
            'cart' => $cartData
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'cart_item_id' => 'nullable|string',
            'product_id' => 'required_without:cart_item_id|string',
            'variant_id' => 'nullable|string',
            'quantity' => 'required|integer|min:0',
        ]);

        $cartToken = $request->header('X-Cart-Token');
        if (!$cartToken) {
            return response()->json(['error' => 'No cart token provided'], 400);
        }

        $cartData = $this->getCartData($cartToken);
        if (!$cartData) {
            return response()->json(['error' => 'Cart not found'], 404);
        }

        $cartItemId = $request->cart_item_id;
        $productId = $request->product_id;
        $variantId = $request->variant_id;
        $quantity = $request->quantity;

        $updated = false;
        foreach ($cartData['items'] as $index => $item) {
            $match = false;
            if ($cartItemId) {
                $match = ($item['id'] === $cartItemId);
            } else {
                $match = ($item['product_id'] == $productId && $item['variant_id'] == $variantId);
            }

            if ($match) {
                if ($quantity == 0) {
                    unset($cartData['items'][$index]);
                } else {
                    $cartData['items'][$index]['quantity'] = $quantity;
                }
                $updated = true;
                break;
            }
        }

        if ($updated) {
            $cartData['items'] = array_values($cartData['items']); // Re-index array
            $this->recalculateTotal($cartData);
                    $this->syncCartPrices($cartData);
        $this->recalculateTotal($cartData);
        $this->syncCartPrices($cartData);
        $this->saveCartData($cartToken, $cartData);
        }

        return response()->json($cartData);
    }

    public function remove(Request $request)
    {
        $request->validate([
            'cart_item_id' => 'nullable|string',
            'product_id' => 'required_without:cart_item_id|string',
            'variant_id' => 'nullable|string',
        ]);

        $cartToken = $request->header('X-Cart-Token');
        if (!$cartToken) {
            return response()->json(['error' => 'No cart token provided'], 400);
        }

        $cartData = $this->getCartData($cartToken);
        if (!$cartData) {
            return response()->json(['error' => 'Cart not found'], 404);
        }

        $cartItemId = $request->cart_item_id;
        $productId = $request->product_id;
        $variantId = $request->variant_id;

        // Store removed item before filtering, to check bundle_group_id
        $removedItem = null;
        foreach ($cartData['items'] as $item) {
            $match = false;
            if ($cartItemId) {
                $match = ($item['id'] === $cartItemId);
            } else {
                $match = ($item['product_id'] == $productId && $item['variant_id'] == $variantId);
            }
            if ($match) {
                $removedItem = $item;
                break;
            }
        }

        $initialCount = count($cartData['items']);
        $cartData['items'] = array_filter($cartData['items'], function($item) use ($cartItemId, $productId, $variantId) {
            if ($cartItemId) {
                return $item['id'] !== $cartItemId;
            }
            return !($item['product_id'] == $productId && $item['variant_id'] == $variantId);
        });

        if (count($cartData['items']) !== $initialCount) {
            $cartData['items'] = array_values($cartData['items']);

            // Anti-manipulation: if the removed item was part of a bundle,
            // revert all remaining sibling items back to their original_price
            if ($removedItem && !empty($removedItem['bundle_group_id'])) {
                $bundleGroupId = $removedItem['bundle_group_id'];
                foreach ($cartData['items'] as &$cartItem) {
                    if (isset($cartItem['bundle_group_id']) && $cartItem['bundle_group_id'] === $bundleGroupId) {
                        $cartItem['price'] = $cartItem['original_price'] ?? $cartItem['price'];
                        $cartItem['bundle_group_id'] = null; // remove group tag so further removals don't cascade
                    }
                }
                unset($cartItem);
            }

            $this->recalculateTotal($cartData);
                    $this->syncCartPrices($cartData);
        $this->recalculateTotal($cartData);
        $this->syncCartPrices($cartData);
        $this->saveCartData($cartToken, $cartData);
        }

        return response()->json($cartData);
    }

    public function applyDiscount(Request $request)
    {
        $request->validate([
            'discount_code' => 'required|string',
            'discount_id' => 'required|uuid',
            'discount_amount' => 'required|numeric|min:0'
        ]);

        $cartToken = $request->header('X-Cart-Token');
        if (!$cartToken) {
            return response()->json(['error' => 'No cart token provided'], 400);
        }

        $cartData = $this->getCartData($cartToken);
        if (!$cartData) {
            return response()->json(['error' => 'Cart not found'], 404);
        }

        $cartData['applied_global_discount'] = [
            'code' => $request->discount_code,
            'id' => $request->discount_id,
            'amount' => $request->discount_amount
        ];
        
                $this->syncCartPrices($cartData);
        $this->recalculateTotal($cartData);
        $this->syncCartPrices($cartData);
        $this->saveCartData($cartToken, $cartData);

        return response()->json($cartData);
    }

    public function removeDiscount(Request $request)
    {
        $cartToken = $request->header('X-Cart-Token');
        if (!$cartToken) {
            return response()->json(['error' => 'No cart token provided'], 400);
        }

        $cartData = $this->getCartData($cartToken);
        if (!$cartData) {
            return response()->json(['error' => 'Cart not found'], 404);
        }

        if (isset($cartData['applied_global_discount'])) {
            unset($cartData['applied_global_discount']);
                    $this->syncCartPrices($cartData);
        $this->recalculateTotal($cartData);
        $this->syncCartPrices($cartData);
        $this->saveCartData($cartToken, $cartData);
        }

        return response()->json($cartData);
    }

public function validateStock(Request $request)
    {
        $cartToken = $request->header('X-Cart-Token');
        if (!$cartToken) {
            return response()->json(['error' => 'No cart token provided'], 400);
        }

        $cartData = $this->getCartData($cartToken);
        if (!$cartData || empty($cartData['items'])) {
            return response()->json(['valid' => true, 'cart' => $cartData]);
        }

        $adjusted = false;
        $messages = [];
        $requiresResolution = false;
        $conflicts = [];

        // 1. Calculate requested quantities grouped by variant_id
        $requestedQuantities = [];
        foreach ($cartData['items'] as $index => $item) {
            $variantId = $item['variant_id'];
            if (!$variantId) continue;
            
            if (!isset($requestedQuantities[$variantId])) {
                $requestedQuantities[$variantId] = [
                    'total' => 0,
                    'items' => []
                ];
            }
            $requestedQuantities[$variantId]['total'] += $item['quantity'];
            $requestedQuantities[$variantId]['items'][] = [
                'index' => $index,
                'cart_item_id' => $item['id'] ?? null,
                'name' => $item['name'],
                'quantity' => $item['quantity'],
                'is_bundle' => !empty($item['bundle_group_id'])
            ];
        }

        // 2. Validate stock against requested totals
        foreach ($requestedQuantities as $variantId => $group) {
            $variant = \App\Models\Catalog\ProductVariant::with('inventories')->find($variantId);
            if (!$variant) {
                // Remove all items for this invalid variant
                foreach ($group['items'] as $groupItem) {
                    unset($cartData['items'][$groupItem['index']]);
                }
                $adjusted = true;
                $messages[] = "Un producto ya no estǭ disponible y fue removido del carrito.";
                continue;
            }

            $availableStock = $variant->inventories->sum('stock');

            if ($group['total'] > $availableStock) {
                if (count($group['items']) > 1) {
                    // Conflict: Multiple line items requesting the same variant, exceeding stock!
                    $requiresResolution = true;
                    $conflicts[] = [
                        'variant_id' => $variantId,
                        'name' => $group['items'][0]['name'], // Use first item's name
                        'available_stock' => $availableStock,
                        'total_requested' => $group['total'],
                        'competing_items' => array_map(function($i) use ($cartData) {
                            $cartItem = $cartData['items'][$i['index']];
                            return [
                                'cart_item_id' => $cartItem['id'] ?? null,
                                'product_id' => $cartItem['product_id'],
                                'variant_id' => $cartItem['variant_id'],
                                'name' => $cartItem['name'],
                                'quantity' => $cartItem['quantity'],
                                'is_bundle' => !empty($cartItem['bundle_group_id'])
                            ];
                        }, $group['items'])
                    ];
                } else {
                    // Single line item, just adjust it automatically
                    $idx = $group['items'][0]['index'];
                    if ($availableStock <= 0) {
                        unset($cartData['items'][$idx]);
                        $messages[] = "El producto {$cartData['items'][$idx]['name']} estǭ agotado.";
                    } else {
                        $cartData['items'][$idx]['quantity'] = $availableStock;
                        $messages[] = "Solo quedan {$availableStock} unidades de {$cartData['items'][$idx]['name']}.";
                    }
                    $adjusted = true;
                }
            }
        }

        // If there are conflicts that require manual resolution by the user, we return early
        if ($requiresResolution) {
            return response()->json([
                'valid' => false,
                'requires_resolution' => true,
                'message' => 'Conflicto de inventario detectado. Debes decidir qu artculos conservar.',
                'conflicts' => $conflicts,
                'cart' => $cartData
            ]);
        }

        if ($adjusted) {
            $cartData['items'] = array_values($cartData['items']);
            $this->syncCartPrices($cartData);
            $this->recalculateTotal($cartData);
            $this->saveCartData($cartToken, $cartData);
            
            return response()->json([
                'valid' => false,
                'requires_resolution' => false,
                'message' => 'No pudimos acompletar el stock que deseas, te podemos ofrecer lo que actualmente esta en el carrito',
                'details' => $messages,
                'cart' => $cartData
            ]);
        }

        return response()->json(['valid' => true, 'cart' => $cartData]);
    }
}
