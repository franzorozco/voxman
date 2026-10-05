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
            'brand',
            'category'
        ])->where('is_active', true);

        // Filtro por categoría — solo UUIDs válidos (la columna es uuid en PostgreSQL;
        // un valor inválido provocaba un error 500 con la página de debug completa)
        if ($request->has('category_id')) {
            $ids = $this->parseUuidList($request->input('category_id'));
            if (empty($ids)) {
                // Filtro inválido → no devolver nada en lugar de ignorar el filtro
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('category_id', $ids);
            }
        }

        if ($request->has('exclude_category_id')) {
            $ids = $this->parseUuidList($request->input('exclude_category_id'));
            if (!empty($ids)) {
                $query->whereNotIn('category_id', $ids);
            }
        }

        // Búsqueda por nombre — solo strings, máx 100 chars, comodines escapados
        $rawSearch = $request->input('search');
        if (is_string($rawSearch)) {
            $search = mb_substr(trim(strip_tags($rawSearch)), 0, 100);
            if ($search !== '') {
                // addcslashes escapa '%' y '_' para que no sean wildcards del usuario
                $query->where('name', 'ilike', '%' . addcslashes($search, '%_\\') . '%');
            }
        }

        // Filtro por precio — solo valores numéricos (ignora arrays / texto)
        $minPrice = $request->input('min_price');
        if (is_numeric($minPrice)) {
            $query->where('base_price', '>=', (float) $minPrice);
        }
        $maxPrice = $request->input('max_price');
        if (is_numeric($maxPrice)) {
            $query->where('base_price', '<=', (float) $maxPrice);
        }

        // Ordenamiento — whitelist estricta. Cualquier valor no reconocido (incl. 'recomendados')
        // cae al orden por defecto: sin ORDER BY la paginación de PostgreSQL no es determinista.
        $type = is_string($request->input('list_type')) ? $request->input('list_type') : '';
        if ($type === 'trending') {
            $query->orderBy('views', 'desc');
        } elseif ($type === 'random') {
            $query->inRandomOrder();
        } elseif ($type === 'price_desc') {
            $query->orderBy('base_price', 'desc');
        } elseif ($type === 'price_asc') {
            $query->orderBy('base_price', 'asc');
        } elseif ($type === 'name_asc') {
            $query->orderBy('name', 'asc');
        } else {
            $query->orderBy('created_at', 'desc'); // 'newest', 'recomendados' y valores inválidos
        }
        $query->orderBy('id'); // desempate estable para la paginación

        // per_page limitado a máximo 100 para prevenir dumps masivos de la DB
        $perPage = min(max(1, (int) $request->get('per_page', 24)), 100);
        $paginator = $query->paginate($perPage);

        // Get applicable discounts using DiscountValidationService
        // Optimize: collect products and evaluate discounts in memory to avoid N+1
        $automaticDiscounts = \Illuminate\Support\Facades\Cache::remember('active_automatic_discounts', 300, function() {
            return \App\Models\Discount\Discount::with(['categories', 'brands', 'products', 'variants', 'customers'])
                ->where('is_automatic', true)
                ->where('active', true)
                ->where(function($q) {
                    $q->whereNull('start_date')->orWhere('start_date', '<=', now());
                })
                ->where(function($q) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', now());
                })
                ->get();
        });

        $paginator->getCollection()->transform(function ($product) use ($automaticDiscounts) {
            $product = $this->applyDiscountsToProduct($product, $automaticDiscounts);
            return $this->toPublic($product); // 🔒 ocultar costo y campos internos
        });

        return response()->json($paginator);
    }

    /**
     * Detalle de un producto por slug o ID.
     */
    public function show($slug)
    {
        $slug = (string) $slug;
        if ($slug === '' || mb_strlen($slug) > 255) {
            abort(404);
        }

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
        ])->where('is_active', true) // 🔒 productos inactivos no son públicos
          ->where(function ($q) use ($slug) {
              $q->where('slug', $slug);
              // Solo comparar con `id` si es UUID válido (columna uuid en PostgreSQL)
              if (\Illuminate\Support\Str::isUuid($slug)) {
                  $q->orWhere('id', $slug);
              }
          })
          ->firstOrFail();

        $automaticDiscounts = \Illuminate\Support\Facades\Cache::remember('active_automatic_discounts', 300, function() {
            return \App\Models\Discount\Discount::with(['categories', 'brands', 'products', 'variants', 'customers'])
                ->where('is_automatic', true)
                ->where('active', true)
                ->where(function($q) {
                    $q->whereNull('start_date')->orWhere('start_date', '<=', now());
                })
                ->where(function($q) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', now());
                })
                ->get();
        });

        $product = $this->applyDiscountsToProduct($product, $automaticDiscounts);

        return response()->json($this->toPublic($product)); // 🔒 ocultar costo y campos internos
    }

    /**
     * Convierte un valor (string "a,b,c" o array) en una lista de UUIDs válidos (máx 50).
     */
    private function parseUuidList($value): array
    {
        if (is_string($value)) {
            $value = explode(',', $value);
        }
        if (!is_array($value)) {
            return [];
        }

        return collect($value)
            ->filter(fn ($v) => is_string($v) && \Illuminate\Support\Str::isUuid(trim($v)))
            ->map(fn ($v) => trim($v))
            ->unique()
            ->take(50)
            ->values()
            ->all();
    }

    /** Campos internos que nunca deben salir en la API pública de la tienda. */
    private const HIDDEN_PRODUCT   = ['owner_id', 'deleted_at'];
    private const HIDDEN_VARIANT   = ['cost', 'barcode', 'weight', 'deleted_at'];
    private const HIDDEN_INVENTORY = ['min_stock', 'deleted_at', 'created_at', 'updated_at'];
    private const HIDDEN_BRANCH    = ['deleted_at', 'created_at', 'updated_at'];

    /**
     * Minimiza los datos expuestos: oculta costo, códigos internos y contadores de descuentos.
     * Se aplica solo en la tienda — el admin sigue viendo todos los campos.
     */
    private function toPublic($product)
    {
        $product->makeHidden(self::HIDDEN_PRODUCT);

        if ($product->relationLoaded('product_variants')) {
            $this->hideVariants($product->product_variants);
        }

        if ($product->relationLoaded('bundle_items')) {
            foreach ($product->bundle_items as $bundleItem) {
                $bundleItem->makeHidden(['deleted_at']);

                if ($bundleItem->relationLoaded('product') && $bundleItem->product) {
                    $bundleItem->product->makeHidden(self::HIDDEN_PRODUCT);
                    if ($bundleItem->product->relationLoaded('product_variants')) {
                        $this->hideVariants($bundleItem->product->product_variants);
                    }
                }
                if ($bundleItem->relationLoaded('variant') && $bundleItem->variant) {
                    $this->hideVariants([$bundleItem->variant]);
                }
            }
        }

        return $product;
    }

    private function hideVariants($variants): void
    {
        foreach ($variants as $variant) {
            $variant->makeHidden(self::HIDDEN_VARIANT);

            // Descuentos: solo lo necesario para mostrar (sin used_count, usage_limit, relaciones, etc.)
            $discounts = $variant->getAttribute('active_discounts');
            if ($discounts instanceof \Illuminate\Support\Collection) {
                $variant->setAttribute('active_discounts', $discounts->map(fn ($d) => [
                    'id'    => $d->id,
                    'name'  => $d->name,
                    'type'  => $d->type,
                    'value' => (float) $d->value,
                ])->values());
            }

            if ($variant->relationLoaded('inventories')) {
                foreach ($variant->inventories as $inventory) {
                    $inventory->makeHidden(self::HIDDEN_INVENTORY);
                    if ($inventory->relationLoaded('branch') && $inventory->branch) {
                        $inventory->branch->makeHidden(self::HIDDEN_BRANCH);
                    }
                }
            }
        }
    }

    private function applyPreparedDiscountsToProduct($product, $preparedDiscounts)
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

        foreach ($preparedDiscounts as $pd) {
            $discount = $pd->model;
            if ($discount->usage_limit && $discount->used_count >= $discount->usage_limit) continue;
            if ($discount->usage_limit_per_customer || $discount->customers->isNotEmpty()) continue;

            $discountCategories = $pd->categories;
            $discountBrands = $pd->brands;
            $discountProducts = $pd->products;
            $discountVariants = $pd->variants;
            
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
                    }
                }
            }
        }

        return $product;
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








