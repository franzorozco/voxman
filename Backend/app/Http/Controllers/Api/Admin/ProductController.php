<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Models\Catalog\Product;
use App\Models\Catalog\ProductImage;
use App\Models\Catalog\ProductVariant;
use App\Models\Catalog\VariantAttributeValue;
use App\Models\Catalog\Attribute;
use App\Models\Inventory\Inventory;
use App\Models\Catalog\VariantMeasurement;
use App\Models\Catalog\AttributeValueImage;
use App\Models\Catalog\VariantImage;

class ProductController extends Controller
{
    private function generateUniqueSku($sku, $excludeVariantId = null)
    {
        if (!$sku) return null;
        $originalSku = $sku;
        $counter = 1;
        
        $query = ProductVariant::withTrashed()->where('sku', $sku);
        if ($excludeVariantId) {
            $query->where('id', '!=', $excludeVariantId);
        }
        
        while ($query->exists()) {
            $sku = $originalSku . '-' . $counter;
            $counter++;
            $query = ProductVariant::withTrashed()->where('sku', $sku);
            if ($excludeVariantId) {
                $query->where('id', '!=', $excludeVariantId);
            }
        }
        
        return $sku;
    }
    
    public function index(Request $request)
    {
            $query = Product::query()
            ->with([
                'owner.user.user_profiles',
                'category',
                'brand',
                'category.discounts',
                'discounts',
                'product_type',
                'product_images',
                'attribute_value_images',
                'product_variants.variant_attribute_values.attribute_value.attribute',
                'product_variants.variant_images',
                'product_variants.inventories.branch',
                'product_variants.size',
                'product_variants.fit',
                'product_variants.variant_measurements.measurement_type',
            ]);

        if ($request->status === 'deleted') {
            $query->onlyTrashed();
        } else if ($request->status === 'inactive') {
            $query->where('is_active', false);
        } else if ($request->status === 'all_with_deleted') {
            $query->withTrashed();
        } else {
            $query->where('is_active', true);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('owner_id')) {
            $query->where('owner_id', $request->owner_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                ->orWhere('description', 'ILIKE', "%{$search}%")
                ->orWhereHas('product_variants', function ($q2) use ($search) {
                    $q2->where('sku', 'ILIKE', "%{$search}%")
                       ->orWhere('barcode', 'ILIKE', "%{$search}%");
                });
            });
        }

        switch ($request->sort) {

            case 'price_asc':
                $query->orderBy('base_price', 'asc');
                break;

            case 'price_desc':
                $query->orderBy('base_price', 'desc');
                break;

            case 'popular':
                $query->orderBy('views', 'desc');
                break;

            default:
                $query->latest();
                break;
        }

        $products = $query->paginate(12);

        $products->getCollection()->transform(function ($product) {

            $profile = $product->owner?->user?->user_profiles?->first();

            $product->owner_name = $profile
                ? trim(
                    ($profile->first_name ?? '') . ' ' .
                    ($profile->last_name_paternal ?? '')
                )
                : null;

            $now = now();

            $productDiscount = $product->discounts
                ->first(function ($discount) use ($now) {

                    return
                        $discount->active &&
                        (!$discount->start_date || $discount->start_date <= $now) &&
                        (!$discount->end_date || $discount->end_date >= $now);
                });

            $categoryDiscount = $product->category?->discounts
                ?->first(function ($discount) use ($now) {

                    return
                        $discount->active &&
                        (!$discount->start_date || $discount->start_date <= $now) &&
                        (!$discount->end_date || $discount->end_date >= $now);
                });

            $product->product_discount = $productDiscount
                ? [
                    'id'    => $productDiscount->id,
                    'name'  => $productDiscount->name,
                    'type'  => $productDiscount->type,
                    'value' => $productDiscount->value,
                ]
                : null;

            $product->category_discount = $categoryDiscount
                ? [
                    'id'    => $categoryDiscount->id,
                    'name'  => $categoryDiscount->name,
                    'type'  => $categoryDiscount->type,
                    'value' => $categoryDiscount->value,
                ]
                : null;

            return $product;
        });

        return response()->json($products);
    }

    public function show($id)
    {
        $product = Product::with([
            'brand',
            'category',
            'product_type',
            'product_images',
            'attribute_value_images',
            'product_variants.variant_attribute_values.attribute_value.attribute',
            'product_variants.variant_images',
            'product_variants.inventories.branch',
            'product_variants.variant_measurements.measurement_type',

        ])->findOrFail($id);

        return response()->json($product);
    }

    public function related($id)
    {
        $product = Product::findOrFail($id);
        $products = Product::where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->with('product_images')
            ->take(8)
            ->get();

        return response()->json($products);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();

        try {

            $product = Product::create([
                'id'              => Str::uuid(),
                'owner_id'        => $request->owner_id,
                'category_id'     => empty($request->category_id) || $request->category_id === 'null' ? null : $request->category_id,
                  'product_type_id' => empty($request->product_type_id) || $request->product_type_id === 'null' ? null : $request->product_type_id,
                  'brand_id'        => empty($request->brand_id) || $request->brand_id === 'null' ? null : $request->brand_id,
                'name'            => $request->name,
                'description'     => $request->description,
                'slug'            => Str::slug($request->name),
                'base_price'      => $request->base_price,
                'is_active'       => true,
                'views'           => 0,
                'tags'            => json_decode($request->tags, true),
            ]);

            // =========================
            // IMÁGENES
            // =========================
            if ($request->hasFile('product_images')) {
                foreach ($request->file('product_images') as $file) {

                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('catalog/products', $filename, 's3');

                    $image = new ProductImage([
                        'product_id' => $product->id,
                        'url' => $filePath,
                        'is_main'    => false,
                    ]);
                    $image->id = Str::uuid()->toString();
                    $image->save();
                }
            }

            // =========================
            // COLOR IMAGES (ATTRIBUTE VALUE IMAGES)
            // =========================
            if ($request->has('color_images') && is_array($request->file('color_images'))) {
                foreach ($request->file('color_images') as $colorId => $files) {
                    if (is_array($files)) {
                        foreach ($files as $idx => $file) {
                            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                            $filePath = $file->storeAs('catalog/attributes', $filename, 's3');

                            $image = new AttributeValueImage([
                                'attribute_value_id' => $colorId,
                                'product_id' => $product->id,
                                'url' => $filePath,
                                'is_main'    => $idx === 0,
                                'sort_order' => $idx,
                            ]);
                            $image->id = Str::uuid()->toString();
                            $image->save();
                        }
                    }
                }
            }

            // =========================
            // VARIANTS (FIX IMPORTANTE)
            // =========================
            $variants = $request->input('variants');

            if (is_string($variants)) {
                $variants = json_decode($variants, true);
            }

            if (is_array($variants)) {

                foreach ($variants as $index => $variantData) {

                    $variant = ProductVariant::create([
                        'id'         => Str::uuid(),
                        'product_id' => $product->id,
                        'size_id'    => empty($variantData['size_id']) || $variantData['size_id'] === 'null' ? null : $variantData['size_id'],
                          'fit_id'     => empty($variantData['fit_id']) || $variantData['fit_id'] === 'null' ? null : $variantData['fit_id'],
                        'sku'        => $this->generateUniqueSku($variantData['sku'] ?? null),
                        'barcode'    => $variantData['barcode'] ?? null,
                        'weight'     => $variantData['weight'] ?? 0,
                        'price'      => $variantData['price'],
                        'cost'       => $variantData['cost'],
                        'is_active'  => true,
                    ]);

                    // =========================
                    // VARIANT IMAGES
                    // =========================
                    if ($request->hasFile("variant_images.{$index}")) {
                        foreach ($request->file("variant_images.{$index}") as $file) {
                            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                            $filePath = $file->storeAs('catalog/variants', $filename, 's3');

                            $image = new VariantImage([
                                'variant_id' => $variant->id,
                                'url' => $filePath,
                            ]);
                            $image->id = Str::uuid()->toString();
                            $image->save();
                        }
                    }

                    // atributos
                    foreach (($variantData['attribute_value_ids'] ?? []) as $attributeValueId) {
                        VariantAttributeValue::create([
                            'variant_id' => $variant->id,
                            'attribute_value_id' => $attributeValueId,
                        ]);
                    }

                    // inventarios
                    foreach (($variantData['inventories'] ?? []) as $inventory) {
                        Inventory::create([
                            'branch_id' => $inventory['branch_id'],
                            'variant_id'=> $variant->id,
                            'stock'     => $inventory['stock'],
                            'min_stock' => $inventory['min_stock'] ?? 0,
                        ]);
                    }

                    // measurements
                    foreach (($variantData['measurements'] ?? []) as $measurement) {
                        VariantMeasurement::create([
                            'variant_id' => $variant->id,
                            'measurement_type_id' => $measurement['measurement_type_id'],
                            'value' => $measurement['value'],
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Producto creado correctamente',
                'product' => $product
            ], 201);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear producto',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();

        try {

            $product = Product::findOrFail($id);

            $product->update([
                'owner_id'        => $request->owner_id,
                'category_id'     => empty($request->category_id) || $request->category_id === 'null' ? null : $request->category_id,
                  'product_type_id' => empty($request->product_type_id) || $request->product_type_id === 'null' ? null : $request->product_type_id,
                  'brand_id'        => empty($request->brand_id) || $request->brand_id === 'null' ? null : $request->brand_id,
                'name'            => $request->name,
                'description'     => $request->description,
                'slug'            => Str::slug($request->name),
                'base_price'      => $request->base_price,
                'is_active'       => $request->is_active ?? true,
                'tags'            => json_decode($request->tags, true),
            ]);

            // Ya no borramos todo a ciegas aquí. Lo haremos de manera inteligente más abajo.

            // =========================
            // IMÁGENES (update)
            // =========================
            if ($request->hasFile('product_images')) {
                // Sólo eliminar las imágenes anteriores si se suben nuevas
                ProductImage::where('product_id', $product->id)->delete();
                foreach ($request->file('product_images') as $file) {

                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('catalog/products', $filename, 's3');

                    $image = new ProductImage([
                        'product_id' => $product->id,
                        'url' => $filePath,
                        'is_main'    => false,
                    ]);
                    $image->id = Str::uuid()->toString();
                    $image->save();
                }
            }

            // =========================
            // COLOR IMAGES (UPDATE)
            // =========================
            AttributeValueImage::where('product_id', $product->id)->delete();

            if ($request->has('kept_color_images') && is_array($request->input('kept_color_images'))) {
                foreach ($request->input('kept_color_images') as $colorId => $urls) {
                    if (is_array($urls)) {
                        foreach ($urls as $idx => $url) {
                            $image = new AttributeValueImage([
                                'attribute_value_id' => $colorId,
                                'product_id' => $product->id,
                                'url'        => $url,
                                'is_main'    => $idx === 0,
                            ]);
                            $image->id = Str::uuid()->toString();
                            $image->save();
                        }
                    }
                }
            }

            if ($request->has('color_images') && is_array($request->file('color_images'))) {
                foreach ($request->file('color_images') as $colorId => $files) {
                    if (is_array($files)) {
                        foreach ($files as $idx => $file) {
                            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                            $filePath = $file->storeAs('catalog/attributes', $filename, 's3');

                            $image = new AttributeValueImage([
                                'attribute_value_id' => $colorId,
                                'product_id' => $product->id,
                                'url' => $filePath,
                                'is_main'    => !isset($request->input('kept_color_images')[$colorId]) && $idx === 0,
                            ]);
                            $image->id = Str::uuid()->toString();
                            $image->save();
                        }
                    }
                }
            }

            // =========================
            // VARIANTS FIX (Actualizar sin destruir)
            // =========================
            $variants = $request->input('variants');

            if (is_string($variants)) {
                $variants = json_decode($variants, true);
            }

            if (is_array($variants)) {

                // 1. Identificar IDs recibidos
                $receivedVariantIds = collect($variants)->pluck('id')->filter()->toArray();

                // 2. Eliminar lógicamente las variantes que NO vinieron (Soft Delete)
                $variantsToDelete = ProductVariant::where('product_id', $product->id)
                    ->whereNotIn('id', $receivedVariantIds)
                    ->get();
                    
                foreach ($variantsToDelete as $varToDelete) {
                    VariantAttributeValue::where('variant_id', $varToDelete->id)->delete();
                    VariantMeasurement::where('variant_id', $varToDelete->id)->delete();
                    Inventory::where('variant_id', $varToDelete->id)->delete();
                    $varToDelete->delete();
                }

                foreach ($variants as $index => $variantData) {

                    if (isset($variantData['id']) && $variantData['id']) {
                        // ACTUALIZAR VARIANTE EXISTENTE
                        $variant = ProductVariant::find($variantData['id']);
                        if ($variant && $variant->product_id === $product->id) {
                            $variant->update([
                                'size_id'    => empty($variantData['size_id']) || $variantData['size_id'] === 'null' ? null : $variantData['size_id'],
                          'fit_id'     => empty($variantData['fit_id']) || $variantData['fit_id'] === 'null' ? null : $variantData['fit_id'],
                                'sku'        => $this->generateUniqueSku($variantData['sku'] ?? null, $variant->id),
                                'barcode'    => $variantData['barcode'] ?? null,
                                'weight'     => $variantData['weight'] ?? 0,
                                'price'      => $variantData['price'],
                                'cost'       => $variantData['cost'],
                                'is_active'  => $variantData['is_active'] ?? true,
                            ]);
                            
                            // Limpiamos atributos y medidas para recrearlos limpios
                            VariantAttributeValue::where('variant_id', $variant->id)->delete();
                            VariantMeasurement::where('variant_id', $variant->id)->delete();
                        } else {
                            continue;
                        }
                    } else {
                        // CREAR NUEVA VARIANTE
                        $variant = ProductVariant::create([
                            'id'         => Str::uuid(),
                            'product_id' => $product->id,
                            'size_id'    => empty($variantData['size_id']) || $variantData['size_id'] === 'null' ? null : $variantData['size_id'],
                          'fit_id'     => empty($variantData['fit_id']) || $variantData['fit_id'] === 'null' ? null : $variantData['fit_id'],
                            'sku'        => $this->generateUniqueSku($variantData['sku'] ?? null),
                            'barcode'    => $variantData['barcode'] ?? null,
                            'weight'     => $variantData['weight'] ?? 0,
                            'price'      => $variantData['price'],
                            'cost'       => $variantData['cost'],
                            'is_active'  => true,
                        ]);
                    }

                    // Recrear Atributos
                    foreach (($variantData['attribute_value_ids'] ?? []) as $attributeValueId) {
                        VariantAttributeValue::create([
                            'variant_id' => $variant->id,
                            'attribute_value_id' => $attributeValueId,
                        ]);
                    }

                    // Actualizar o Crear Inventarios
                    foreach (($variantData['inventories'] ?? []) as $inventory) {
                        $invRecord = Inventory::firstOrCreate(
                            ['branch_id' => $inventory['branch_id'], 'variant_id' => $variant->id],
                            ['stock' => 0, 'min_stock' => 0]
                        );
                        
                        $invRecord->update([
                            'min_stock' => $inventory['min_stock'] ?? 0,
                            'stock'     => $inventory['stock'] ?? 0
                        ]);
                    }

                    // Recrear Measurements
                    foreach (($variantData['measurements'] ?? []) as $measurement) {
                        VariantMeasurement::create([
                            'variant_id' => $variant->id,
                            'measurement_type_id' => $measurement['measurement_type_id'],
                            'value' => $measurement['value'],
                        ]);
                    }

                    // =========================
                    // VARIANT IMAGES UPDATE
                    // =========================
                    // Borramos las viejas que no se mantuvieron
                    $keptVariantUrls = $request->input("kept_variant_images.{$index}") ?? [];
                    if (!is_array($keptVariantUrls)) {
                        $keptVariantUrls = [];
                    }
                    VariantImage::where('variant_id', $variant->id)
                                ->whereNotIn('url', $keptVariantUrls)
                                ->delete();

                    if ($request->hasFile("variant_images.{$index}")) {
                        foreach ($request->file("variant_images.{$index}") as $file) {
                            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                            $filePath = $file->storeAs('catalog/variants', $filename, 's3');

                            $image = new VariantImage([
                                'variant_id' => $variant->id,
                                'url' => $filePath,
                            ]);
                            $image->id = Str::uuid()->toString();
                            $image->save();
                        }
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Producto actualizado correctamente',
                'product' => Product::with([
                    'brand',
                    'category',
                    'product_type',
                    'product_images',
                    'attribute_value_images',
                    'product_variants.variant_attribute_values.attribute_value.attribute',
                    'product_variants.variant_images',
                    'product_variants.inventories.branch',
                    'product_variants.size',
                    'product_variants.fit',
                    'product_variants.variant_measurements.measurement_type',
                ])->find($product->id)
            ]);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'message' => 'Error al actualizar producto',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function updateImages(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $product = Product::findOrFail($id);

            // =========================
            // MAIN PRODUCT IMAGES
            // =========================
            if ($request->hasFile('product_images')) {
                ProductImage::where('product_id', $product->id)->delete();
                foreach ($request->file('product_images') as $file) {
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('catalog/products', $filename, 's3');

                    $image = new ProductImage([
                        'product_id' => $product->id,
                        'url' => $filePath,
                        'is_main'    => false,
                    ]);
                    $image->id = Str::uuid()->toString();
                    $image->save();
                }
            }

            // =========================
            // COLOR IMAGES (UPDATE)
            // =========================
            AttributeValueImage::where('product_id', $product->id)->delete();

            if ($request->has('kept_color_images') && is_array($request->input('kept_color_images'))) {
                foreach ($request->input('kept_color_images') as $colorId => $urls) {
                    if (is_array($urls)) {
                        foreach ($urls as $idx => $url) {
                            $image = new AttributeValueImage([
                                'attribute_value_id' => $colorId,
                                'product_id' => $product->id,
                                'url'        => $url,
                                'is_main'    => $idx === 0,
                                'sort_order' => $idx,
                            ]);
                            $image->id = Str::uuid()->toString();
                            $image->save();
                        }
                    }
                }
            }

            if ($request->has('color_images') && is_array($request->file('color_images'))) {
                foreach ($request->file('color_images') as $colorId => $files) {
                    if (is_array($files)) {
                        foreach ($files as $idx => $file) {
                            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                            $filePath = $file->storeAs('catalog/attributes', $filename, 's3');

                            $image = new AttributeValueImage([
                                'attribute_value_id' => $colorId,
                                'product_id' => $product->id,
                                'url' => $filePath,
                                'is_main'    => !isset($request->input('kept_color_images')[$colorId]) && $idx === 0,
                                'sort_order' => (isset($request->input('kept_color_images')[$colorId]) ? count($request->input('kept_color_images')[$colorId]) : 0) + $idx,
                            ]);
                            $image->id = Str::uuid()->toString();
                            $image->save();
                        }
                    }
                }
            }

            // =========================
            // VARIANT IMAGES (UPDATE)
            // =========================
            $allVariants = ProductVariant::where('product_id', $product->id)->orderBy('id')->get();
            
            // Delete old variant images
            foreach ($allVariants as $variant) {
                VariantImage::where('variant_id', $variant->id)->delete();
            }

            if ($request->has('kept_variant_images') && is_array($request->input('kept_variant_images'))) {
                foreach ($request->input('kept_variant_images') as $variantIndex => $urls) {
                    if (isset($allVariants[$variantIndex])) {
                        $variant = $allVariants[$variantIndex];
                        if (is_array($urls)) {
                            foreach ($urls as $idx => $url) {
                                $image = new VariantImage([
                                    'variant_id' => $variant->id,
                                    'url'        => $url,
                                    'is_main'    => $idx === 0,
                                    'sort_order' => $idx,
                                ]);
                                $image->id = Str::uuid()->toString();
                                $image->save();
                            }
                        }
                    }
                }
            }

            if ($request->has('variant_images') && is_array($request->file('variant_images'))) {
                foreach ($request->file('variant_images') as $variantIndex => $files) {
                    if (isset($allVariants[$variantIndex])) {
                        $variant = $allVariants[$variantIndex];
                        if (is_array($files)) {
                            foreach ($files as $idx => $file) {
                                $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                                $filePath = $file->storeAs('catalog/variants', $filename, 's3');

                                $image = new VariantImage([
                                    'variant_id' => $variant->id,
                                    'url' => $filePath,
                                    'is_main'    => !isset($request->input('kept_variant_images')[$variantIndex]) && $idx === 0,
                                    'sort_order' => (isset($request->input('kept_variant_images')[$variantIndex]) ? count($request->input('kept_variant_images')[$variantIndex]) : 0) + $idx,
                                ]);
                                $image->id = Str::uuid()->toString();
                                $image->save();
                            }
                        }
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Imágenes actualizadas correctamente',
                'product' => Product::with([
                    'brand',
                    'category',
                    'product_type',
                    'product_images',
                    'attribute_value_images',
                    'product_variants.variant_attribute_values.attribute_value.attribute',
                    'product_variants.variant_images',
                    'product_variants.inventories.branch',
                    'product_variants.size',
                    'product_variants.fit',
                    'product_variants.variant_measurements.measurement_type',
                ])->find($product->id)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al actualizar imágenes',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function updateMeasurements(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $product = Product::findOrFail($id);
            $measurements = $request->input('measurements'); // format: { variant_id: [ { measurement_type_id, value } ] }

            foreach ($measurements as $variantId => $variantMeasurements) {
                // Verify variant belongs to product
                $variant = ProductVariant::where('id', $variantId)->where('product_id', $product->id)->firstOrFail();

                // Clear old measurements for this variant
                VariantMeasurement::where('variant_id', $variant->id)->delete();

                // Insert new ones
                foreach ($variantMeasurements as $m) {
                    if (!empty($m['value'])) {
                        VariantMeasurement::create([
                            'variant_id' => $variant->id,
                            'measurement_type_id' => $m['measurement_type_id'],
                            'value' => $m['value']
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json([
                'message' => 'Medidas actualizadas correctamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Error in updateMeasurements: ' . $e->getMessage() . ' Trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Error al actualizar medidas',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function partialUpdate(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $product = Product::findOrFail($id);
            $updateData = [];

            if ($request->has('owner_id')) {
                $updateData['owner_id'] = $request->owner_id;
            }
            if ($request->has('category_id')) {
                $updateData['category_id'] = $request->category_id;
            }
            if ($request->has('is_active')) {
                $updateData['is_active'] = $request->is_active;
            }
            if ($request->has('tags')) {
                $updateData['tags'] = is_string($request->tags) ? json_decode($request->tags, true) : $request->tags;
            }

            if (!empty($updateData)) {
                $product->update($updateData);
            }

            DB::commit();

            return response()->json([
                'message' => 'Producto actualizado parcialmente',
                'product' => $product
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al actualizar producto',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $product = Product::findOrFail($id);
            $product->delete();
            
            $variants = ProductVariant::where('product_id', $product->id)->get();
            foreach ($variants as $variant) {
                $variant->delete();
            }

            DB::commit();
            return response()->json([
                'message' => 'Producto movido a la papelera correctamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al eliminar producto',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function restore($id)
    {
        DB::beginTransaction();
        try {
            $product = Product::withTrashed()->findOrFail($id);
            $product->restore();
            
            $variants = ProductVariant::withTrashed()->where('product_id', $product->id)->get();
            foreach ($variants as $variant) {
                $variant->restore();
            }

            DB::commit();
            return response()->json([
                'message' => 'Producto restaurado correctamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al restaurar producto',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function forceDestroy($id)
    {
        DB::beginTransaction();
        try {
            $product = Product::withTrashed()->findOrFail($id);
            
            ProductImage::where('product_id', $product->id)->delete();
            AttributeValueImage::where('product_id', $product->id)->delete();
            
            $variants = ProductVariant::withTrashed()->where('product_id', $product->id)->get();
            foreach ($variants as $variant) {
                VariantAttributeValue::where('variant_id', $variant->id)->delete();
                Inventory::where('variant_id', $variant->id)->delete();
                VariantMeasurement::where('variant_id', $variant->id)->delete();
                VariantImage::where('variant_id', $variant->id)->delete();
                
                $variant->forceDelete();
            }

            $product->forceDelete();

            DB::commit();
            return response()->json([
                'message' => 'Producto eliminado permanentemente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al eliminar producto permanentemente',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function getAttributes()
    {
        return response()->json(
            Attribute::with('attribute_values')->get()
        );
    }

}