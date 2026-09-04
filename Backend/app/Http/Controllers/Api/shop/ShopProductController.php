<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Catalog\Product;

class ShopProductController extends Controller
{
    /**
     * Listar productos para la tienda online.
     * Carga las relaciones correctas de imágenes y variantes.
     */
        public function index(Request $request)
    {
        $query = Product::with([
            'product_images',
            'attribute_value_images.attributeValue.attribute',
            'product_variants.variant_images',
            'product_variants.variant_attribute_values.attribute_value.attribute',
            'product_variants.size',
            'product_variants.fit',
            'brand',
            'category'
        ])->where('is_active', true);

        // Filtro por categora
        if ($request->has('category_id')) {
            $categoryId = $request->category_id;
            if (is_array($categoryId)) {
                $query->whereIn('category_id', $categoryId);
            } elseif (str_contains((string)$categoryId, ',')) {
                $query->whereIn('category_id', explode(',', $categoryId));
            } else {
                $query->where('category_id', $categoryId);
            }
        }

        // Bǧsqueda por nombre
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $paginator = $query->paginate($request->get('per_page', 24));

        // Get applicable discounts using DiscountValidationService
        // Optimize: collect products and evaluate discounts in memory to avoid N+1
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

        $paginator->getCollection()->transform(function ($product) use ($automaticDiscounts) {
            $applicableDiscounts = collect();

            foreach ($automaticDiscounts as $discount) {
                // Check usage limits
                if ($discount->usage_limit && $discount->used_count >= $discount->usage_limit) {
                    continue;
                }

                // Exclude discounts that require a registered customer
                if ($discount->usage_limit_per_customer || $discount->customers->isNotEmpty()) {
                    continue;
                }

                $discountCategories = $discount->categories->pluck('id')->toArray();
                $discountBrands = $discount->brands->pluck('id')->toArray();
                $discountProducts = $discount->products->pluck('id')->toArray();
                $discountVariants = $discount->variants->pluck('id')->toArray();
                
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
                    $productVariantIds = $product->product_variants->pluck('id')->toArray();
                    if (!empty(array_intersect($productVariantIds, $discountVariants))) {
                        $matches = true;
                    }
                }

                if ($matches) {
                    $applicableDiscounts->push($discount);
                }
            }

            // Map standard format to show in catalog
            $product->active_discounts = $applicableDiscounts->map(function($d) {
                return [
                    'id' => $d->id,
                    'name' => $d->name,
                    'type' => $d->type,
                    'value' => $d->value
                ];
            })->values();

            return $product;
        });

        return response()->json($paginator);
    }

    /**
     * Detalle de un producto por slug o ID.
     */
    public function show($slug)
    {
        $product = Product::with([
            'product_images',
            'attribute_value_images.attributeValue.attribute',
            'product_variants.variant_images',
            'product_variants.variant_attribute_values.attribute_value.attribute',
            'product_variants.size',
            'product_variants.fit',
            'product_variants.variant_measurements.measurement_type',
            'product_variants.inventories.branch',
            'brand',
            'category',
            'shorts',
            'bundle_items.product.product_images',
            'bundle_items.product.attribute_value_images.attributeValue',
            'bundle_items.product.product_variants.variant_images',
            'bundle_items.product.product_variants.variant_attribute_values.attribute_value.attribute',
            'bundle_items.product.product_variants.size',
            'bundle_items.product.product_variants.inventories.branch',
            'bundle_items.product.product_variants.variant_measurements.measurement_type',
            'bundle_items.variant.variant_images',
            'bundle_items.variant.variant_attribute_values.attribute_value.attribute',
            'bundle_items.variant.size',
            'bundle_items.variant.fit',
            'bundle_items.variant.variant_measurements.measurement_type',
        ])->where('slug', $slug)
          ->orWhere('id', $slug)
          ->firstOrFail();

        return response()->json($product);
    }
}
