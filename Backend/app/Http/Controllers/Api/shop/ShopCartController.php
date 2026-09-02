<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use App\Models\Catalog\Product;
use App\Models\Catalog\ProductVariant;
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

        // Apply bundle override price if provided
        if ($overridePrice !== null) {
            $price = $overridePrice;
        }

        // The stored original_price: if explicitly provided use it, else the natural price
        $storedOriginalPrice = ($originalPrice !== null) ? (float)$originalPrice : (float)$price;

        // Check if item already exists
        $foundIndex = -1;
        foreach ($cartData['items'] as $index => $item) {
            if ($item['product_id'] == $productId && $item['variant_id'] == $variantId) {
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
                'bundle_group_id' => $bundleGroupId,
                'quantity'        => $quantity,
                'size'            => $sizeName,
                'color'           => $colorName,
                'image'           => $imageUrl
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
            'product_id' => 'required|string',
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

        $productId = $request->product_id;
        $variantId = $request->variant_id;
        $quantity = $request->quantity;

        $updated = false;
        foreach ($cartData['items'] as $index => $item) {
            if ($item['product_id'] == $productId && $item['variant_id'] == $variantId) {
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
            'product_id' => 'required|string',
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

        $productId = $request->product_id;
        $variantId = $request->variant_id;

        // Store removed item before filtering, to check bundle_group_id
        $removedItem = null;
        foreach ($cartData['items'] as $item) {
            if ($item['product_id'] == $productId && $item['variant_id'] == $variantId) {
                $removedItem = $item;
                break;
            }
        }

        $initialCount = count($cartData['items']);
        $cartData['items'] = array_filter($cartData['items'], function($item) use ($productId, $variantId) {
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
