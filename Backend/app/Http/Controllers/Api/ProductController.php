<?php

namespace App\Http\Controllers\Api;

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
    
    public function index(Request $request)
    {
        $query = Product::query()
            ->with([
                'owner.user.user_profiles',
                'category',
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
            ])
            ->whereNull('deleted_at')
            ->where('is_active', true);

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
                ->orWhere('description', 'ILIKE', "%{$search}%");
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
                'category_id'     => $request->category_id,
                'product_type_id' => $request->product_type_id,
                'name'            => $request->name,
                'description'     => $request->description,
                'slug'            => Str::slug($request->name),
                'base_price'      => $request->base_price,
                'is_active'       => true,
                'views'           => 0,
            ]);

            // =========================
            // IMÁGENES
            // =========================
            if ($request->hasFile('product_images')) {
                foreach ($request->file('product_images') as $file) {

                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('products', $filename, 'public');

                    $image = new ProductImage([
                        'product_id' => $product->id,
                        'url'        => '/storage/' . $filePath,
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
                            $filePath = $file->storeAs('attributes', $filename, 'public');

                            $image = new AttributeValueImage([
                                'attribute_value_id' => $colorId,
                                'product_id' => $product->id,
                                'url'        => '/storage/' . $filePath,
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
                        'size_id'    => $variantData['size_id'],
                        'fit_id'     => $variantData['fit_id'],
                        'sku'        => $variantData['sku'],
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
                            $filePath = $file->storeAs('variants', $filename, 'public');

                            $image = new VariantImage([
                                'variant_id' => $variant->id,
                                'url'        => '/storage/' . $filePath,
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
                'category_id'     => $request->category_id,
                'product_type_id' => $request->product_type_id,
                'name'            => $request->name,
                'description'     => $request->description,
                'slug'            => Str::slug($request->name),
                'base_price'      => $request->base_price,
                'is_active'       => $request->is_active ?? true,
            ]);

            // limpiar relaciones
            foreach ($product->product_variants as $variant) {
                VariantAttributeValue::where('variant_id', $variant->id)->delete();
                Inventory::where('variant_id', $variant->id)->delete();
                VariantMeasurement::where('variant_id', $variant->id)->delete();
            }

            // =========================
            // VARIANTS
            // =========================
            ProductVariant::where('product_id', $product->id)->delete();

            // =========================
            // IMÁGENES (update)
            // =========================
            if ($request->hasFile('product_images')) {
                // Sólo eliminar las imágenes anteriores si se suben nuevas
                ProductImage::where('product_id', $product->id)->delete();
                foreach ($request->file('product_images') as $file) {

                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('products', $filename, 'public');

                    $image = new ProductImage([
                        'product_id' => $product->id,
                        'url'        => '/storage/' . $filePath,
                        'is_main'    => false,
                    ]);
                    $image->id = Str::uuid()->toString();
                    $image->save();
                }
            }

            // =========================
            // VARIANTS FIX
            // =========================
            $variants = $request->input('variants');

            if (is_string($variants)) {
                $variants = json_decode($variants, true);
            }

            if (is_array($variants)) {

                foreach ($variants as $variantData) {

                    $variant = ProductVariant::create([
                        'id'         => Str::uuid(),
                        'product_id' => $product->id,
                        'size_id'    => $variantData['size_id'],
                        'fit_id'     => $variantData['fit_id'],
                        'sku'        => $variantData['sku'],
                        'barcode'    => $variantData['barcode'] ?? null,
                        'weight'     => $variantData['weight'] ?? 0,
                        'price'      => $variantData['price'],
                        'cost'       => $variantData['cost'],
                        'is_active'  => true,
                    ]);

                    foreach (($variantData['attribute_value_ids'] ?? []) as $attributeValueId) {
                        VariantAttributeValue::create([
                            'variant_id' => $variant->id,
                            'attribute_value_id' => $attributeValueId,
                        ]);
                    }

                    foreach (($variantData['inventories'] ?? []) as $inventory) {
                        Inventory::create([
                            'branch_id' => $inventory['branch_id'],
                            'variant_id'=> $variant->id,
                            'stock'     => $inventory['stock'],
                            'min_stock' => $inventory['min_stock'] ?? 0,
                        ]);
                    }

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
                'message' => 'Producto actualizado correctamente',
                'product' => Product::with([
                    'category',
                    'product_type',
                    'product_images',
                    'product_variants.variant_attribute_values.attribute_value.attribute',
                    'product_variants.inventories.branch',
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

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $product = Product::findOrFail($id);
            $product->delete();
            ProductImage::where('product_id', $product->id)->delete();
            $variants = ProductVariant::where('product_id', $product->id)->get();
            foreach ($variants as $variant) {
                VariantAttributeValue::where('variant_id', $variant->id)->delete();
                
                Inventory::where('variant_id', $variant->id)->delete();
                VariantMeasurement::where('variant_id', $variant->id)->delete();
                $variant->delete();
            }

            DB::commit();
            return response()->json([
                'message' => 'Producto eliminado correctamente'
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
        $product = Product::withTrashed()->findOrFail($id);
        $product->restore();
        return response()->json([
            'message' => 'Producto restaurado correctamente'
        ]);
    }

    public function getAttributes()
    {
        return response()->json(
            Attribute::with('attribute_values')->get()
        );
    }

}