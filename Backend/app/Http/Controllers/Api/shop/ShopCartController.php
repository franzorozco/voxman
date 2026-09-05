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

    public function show(Request $request)
    {
        $cartToken = $request->header('X-Cart-Token');
        $cartData = $this->getCartData($cartToken);

        if ($cartData) {
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

        foreach ($cartData['items'] as $index => $item) {
            $variantId = $item['variant_id'];
            if (!$variantId) continue;

            $variant = ProductVariant::with('inventories')->find($variantId);
            if (!$variant) {
                unset($cartData['items'][$index]);
                $adjusted = true;
                $messages[] = "El producto {$item['name']} ya no está disponible.";
                continue;
            }

            $availableStock = $variant->inventories->sum('stock');
            if ($availableStock < $item['quantity']) {
                if ($availableStock <= 0) {
                    unset($cartData['items'][$index]);
                    $messages[] = "El producto {$item['name']} está agotado.";
                } else {
                    $cartData['items'][$index]['quantity'] = $availableStock;
                    $messages[] = "Solo quedan {$availableStock} unidades de {$item['name']}.";
                }
                $adjusted = true;
            }
        }

        if ($adjusted) {
            $cartData['items'] = array_values($cartData['items']);
            $this->recalculateTotal($cartData);
            $this->saveCartData($cartToken, $cartData);
            
            return response()->json([
                'valid' => false,
                'message' => 'No pudimos acompletar el stock que deseas, te podemos ofrecer lo que actualmente esta en el carrito',
                'details' => $messages,
                'cart' => $cartData
            ]);
        }

        return response()->json(['valid' => true, 'cart' => $cartData]);
    }
}
