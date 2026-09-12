<?php
namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Catalog\Product;

class ShopProductController extends Controller
{
    /**
     * Listar productos para la tienda online.
     * Carga las relaciones correctas de imÃƒÂ¡genes y variantes.
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
            'category',
            'bundle_items.product',
            'bundle_items.variant'
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

        // BÃ‡Â§squeda por nombre
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
            return $this->applyDiscountsToProduct($product, $automaticDiscounts);
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

        $product = $this->applyDiscountsToProduct($product, $automaticDiscounts);

        return response()->json($product);
    }

    private function applyDiscountsToProduct($product, $automaticDiscounts)
    {
        foreach ($product->product_variants as $variant) {
            $variant->active_discounts = collect();
            $variant->base_price = $variant->price ?: $product->base_price;
            $variant->discounted_price = $variant->base_price;
            $variant->has_discount = false;
            $variant->discount_label = null;
        }

        $product->has_discount = false;
        $product->discount_label = null;
        $product->discounted_price = $product->base_price;

        foreach ($automaticDiscounts as $discount) {
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
            }

            if ($productApplies) {
                $discountAmount = 0;
                if ($discount->type === 'percentage') {
                    $discountAmount = $product->base_price * ($discount->value / 100);
                    $label = "-".floatval($discount->value)."%";
                } else {
                    $discountAmount = $discount->value;
                    $label = "-Bs ".floatval($discount->value);
                }
                if ($discount->max_discount_amount) {
                    $discountAmount = min($discountAmount, $discount->max_discount_amount);
                }
                $discountAmount = min($discountAmount, $product->base_price);
                
                $newPrice = max(0, $product->base_price - $discountAmount);
                if ($newPrice < $product->discounted_price) {
                    $product->discounted_price = $newPrice;
                    $product->has_discount = true;
                    $product->discount_label = $label;
                }
            }

            foreach ($product->product_variants as $variant) {
                $variantApplies = $productApplies || in_array($variant->id, $discountVariants);
                
                if ($variantApplies) {
                    $variant->active_discounts->push($discount);
                    
                    $discountAmount = 0;
                    if ($discount->type === 'percentage') {
                        $discountAmount = $variant->base_price * ($discount->value / 100);
                        $label = "-".floatval($discount->value)."%";
                    } else {
                        $discountAmount = $discount->value;
                        $label = "-Bs ".floatval($discount->value);
                    }
                    
                    if ($discount->max_discount_amount) {
                        $discountAmount = min($discountAmount, $discount->max_discount_amount);
                    }
                    $discountAmount = min($discountAmount, $variant->base_price);
                    
                    $newPrice = max(0, $variant->base_price - $discountAmount);
                    if ($newPrice < $variant->discounted_price) {
                        $variant->discounted_price = $newPrice;
                        $variant->has_discount = true;
                        $variant->discount_label = $label;
                        $variant->applied_discount_id = $discount->id;
                    }
                }
            }
        }

        $product->active_discounts = []; // Para no romper compatibilidad
        return $product;
    }
}


