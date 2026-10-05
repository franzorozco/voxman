<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Catalog\Product;
use App\Models\Catalog\ProductVariant;

class ShopWishlistController extends Controller
{
    /**
     * Returns the wishlist with enriched product + variant data.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->customer) {
            return response()->json(['items' => []]);
        }

        $wishlist = $this->getOrCreateWishlist($user->customer->id);

        $rawItems = DB::table('wishlist_items')
            ->where('wishlist_id', $wishlist->id)
            ->get();

        $enriched = $rawItems->map(function ($item) {
            $product = Product::with([
                'product_images',
                'attribute_value_images.attributeValue',
                'discounts',
            ])->find($item->product_id);

            if (!$product) return null;

            // Cover image: first product_image, or first attribute_value_image
            $coverImage = $product->product_images->first()?->url
                ?? $product->attribute_value_images->first()?->url
                ?? null;

            // Discount info from discounts relation
            $activeDiscount = $product->discounts
                ->where('is_active', true)
                ->first();

            $hasDiscount    = (bool) $activeDiscount;
            $discountLabel  = null;
            $displayPrice   = (float) $product->base_price;
            $originalPrice  = (float) $product->base_price;

            if ($activeDiscount) {
                if ($activeDiscount->type === 'percentage') {
                    $displayPrice  = round($originalPrice * (1 - $activeDiscount->value / 100), 2);
                    $discountLabel = "-{$activeDiscount->value}%";
                } elseif ($activeDiscount->type === 'fixed') {
                    $displayPrice  = max(0, $originalPrice - $activeDiscount->value);
                    $discountLabel = "-Bs {$activeDiscount->value}";
                }
            }

            // Variant-level enrichment
            $variantInfo = null;
            if ($item->variant_id) {
                $variant = ProductVariant::with([
                    'size',
                    'variant_attribute_values.attribute_value.attribute',
                    'variant_images',
                ])->find($item->variant_id);

                if ($variant) {
                    // Color from variant attribute values
                    $colorAttr = $variant->variant_attribute_values
                        ->first(function ($av) {
                            return str_contains(
                                strtolower($av->attribute_value?->attribute?->name ?? ''),
                                'color'
                            );
                        });

                    $colorName = $colorAttr?->attribute_value?->value;

                    // If variant has its own price, use it
                    if ($variant->price !== null) {
                        $originalPrice = (float) $variant->price;
                        $displayPrice  = $hasDiscount
                            ? round($originalPrice * (1 - ($activeDiscount->value ?? 0) / 100), 2)
                            : $originalPrice;
                    }

                    // Variant-specific cover image
                    $variantCover = $variant->variant_images->first()?->url;

                    // Color image from attribute_value_images on the product
                    if ($colorName) {
                        $colorImg = $product->attribute_value_images
                            ->first(fn($i) => $i->attributeValue?->value === $colorName);
                        if ($colorImg) $variantCover = $colorImg->url;
                    }

                    if ($variantCover) $coverImage = $variantCover;

                    $variantInfo = [
                        'id'    => $variant->id,
                        'sku'   => $variant->sku,
                        'size'  => $variant->size?->name,
                        'color' => $colorName,
                    ];
                }
            }

            return [
                'id'             => $item->id,
                'product_id'     => $item->product_id,
                'variant_id'     => $item->variant_id,
                'created_at'     => $item->created_at,
                'product_name'   => $product->name,
                'product_slug'   => $product->slug,
                'is_bundle'      => (bool) $product->is_bundle,
                'cover_image'    => $coverImage,
                'original_price' => $originalPrice,
                'display_price'  => $displayPrice,
                'has_discount'   => $hasDiscount,
                'discount_label' => $discountLabel,
                'variant'        => $variantInfo,
            ];
        })->filter()->values();

        return response()->json(['items' => $enriched]);
    }

    public function toggle(Request $request)
    {
        $request->validate([
            'product_id' => 'required|uuid',
            'variant_id' => 'nullable|uuid',
        ]);

        $user = $request->user();
        if (!$user || !$user->customer) {
            return response()->json(['message' => 'Solo clientes pueden usar la lista de deseos.'], 403);
        }

        $wishlist = $this->getOrCreateWishlist($user->customer->id);

        $existingQuery = DB::table('wishlist_items')
            ->where('wishlist_id', $wishlist->id)
            ->where('product_id', $request->product_id);

        if ($request->variant_id) {
            $existingQuery->where('variant_id', $request->variant_id);
        } else {
            $existingQuery->whereNull('variant_id');
        }

        $existing = $existingQuery->first();

        if ($existing) {
            DB::table('wishlist_items')->where('id', $existing->id)->delete();
            $status = 'removed';
        } else {
            DB::table('wishlist_items')->insert([
                'id'         => (string) \Illuminate\Support\Str::uuid(),
                'wishlist_id'=> $wishlist->id,
                'product_id' => $request->product_id,
                'variant_id' => $request->variant_id ?: null,
                'created_at' => now(),
            ]);
            $status = 'added';
        }

        // Return lightweight items for optimistic store sync
        $rawItems = DB::table('wishlist_items')->where('wishlist_id', $wishlist->id)->get();
        return response()->json(['status' => $status, 'items' => $rawItems]);
    }

    // ─── Private helpers ──────────────────────────────────────────

    private function getOrCreateWishlist(string $customerId)
    {
        $wishlist = DB::table('wishlists')->where('customer_id', $customerId)->first();
        if (!$wishlist) {
            $id = (string) \Illuminate\Support\Str::uuid();
            DB::table('wishlists')->insert([
                'id'          => $id,
                'customer_id' => $customerId,
                'created_at'  => now(),
            ]);
            $wishlist = DB::table('wishlists')->where('id', $id)->first();
        }
        return $wishlist;
    }
}
