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
use App\Models\Catalog\VariantSize;
use App\Models\Inventory\Inventory;
use App\Models\Catalog\VariantMeasurement;
 
class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->with([
                'owner.user.user_profiles',
                'category',
                'product_type',
                'product_images',
                'product_variants.variant_attribute_values.attribute_value.attribute',
                'product_variants.variant_sizes',
            ])
            ->whereNull('deleted_at')
            ->where('is_active', true);

        $products = $query->with([
            'product_variants.inventories',
        ]);
        
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
                ? trim(($profile->first_name ?? '') . ' ' . ($profile->last_name_paternal ?? ''))
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
            'product_variants.variant_attribute_values.attribute_value.attribute',
            'product_variants.variant_images',
            'product_variants.variant_sizes',
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

            if ($request->hasFile('product_images')) {
                foreach ($request->file('product_images') as $file) {
                    $path = config('storage_paths.product_images');
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs($path, $filename, 'public');
                    ProductImage::create([
                        'id'         => Str::uuid(),
                        'product_id' => $product->id,
                        'url'        => Storage::url($filePath),
                        'is_main'    => false,
                    ]);
                }
            }

            if ($request->has('variants')) {

                foreach ($request->variants as $variantData) {

                    $variant = ProductVariant::create([

                        'id'         => Str::uuid(),
                        'product_id' => $product->id,
                        'sku'        => $variantData['sku'],
                        'barcode'    => $variantData['barcode'] ?? null,
                        'weight'     => $variantData['weight'] ?? 0,
                        'price'      => $variantData['price'],
                        'cost'       => $variantData['cost'],
                        'is_active'  => true,
                    ]);

                    if (isset($variantData['attribute_value_ids'])) {

                        foreach ($variantData['attribute_value_ids'] as $attributeValueId) {

                            VariantAttributeValue::create([

                                'variant_id'         => $variant->id,
                                'attribute_value_id' => $attributeValueId,
                            ]);
                        }
                    }

                    if (isset($variantData['sizes'])) {

                        foreach ($variantData['sizes'] as $size) {

                            VariantSize::create([

                                'variant_id' => $variant->id,
                                'size_id'    => $size['size_id'],
                                'fit_id'     => $size['fit_id'],
                            ]);
                        }
                    }

                    if (isset($variantData['inventories'])) {

                        foreach ($variantData['inventories'] as $inventory) {

                            Inventory::create([

                                'branch_id' => $inventory['branch_id'],
                                'variant_id'=> $variant->id,

                                'stock'     => $inventory['stock'],
                                'min_stock' => $inventory['min_stock'] ?? 0,
                            ]);
                        }
                    }

                    if (isset($variantData['measurements'])) {

                        foreach ($variantData['measurements'] as $measurement) {

                            VariantMeasurement::create([

                                'variant_id'         => $variant->id,
                                'size_id'            => $measurement['size_id'],
                                'measurement_type_id'=> $measurement['measurement_type_id'],

                                'value'              => $measurement['value'],
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            return response()->json([

                'message' => 'Producto creado correctamente',

                'product' => Product::with([

                    'category',
                    'product_type',
                    'product_images',
                    'product_variants.variant_attribute_values.attribute_value.attribute',
                    'product_variants.variant_sizes',
                    'product_variants.inventories.branch',
                    'product_variants.variant_measurements.measurement_type',

                ])->find($product->id)

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

            foreach ($product->product_variants as $variant) {

                VariantAttributeValue::where('variant_id', $variant->id)->delete();
                VariantSize::where('variant_id', $variant->id)->delete();
                Inventory::where('variant_id', $variant->id)->delete();
                VariantMeasurement::where('variant_id', $variant->id)->delete();
            }
            ProductImage::where('product_id', $product->id)->delete();
            ProductVariant::where('product_id', $product->id)->delete();

            if ($request->has('product_images')) {

                foreach ($request->product_images as $image) {
                    $filePath = $file->storeAs(config('storage_paths.product_images'), $filename, 'public');
                    ProductImage::create([
                        'id'         => Str::uuid(),
                        'product_id' => $product->id,
                        'url'        => $image['url'],
                        'is_main'    => $image['is_main'] ?? false,
                    ]);
                }
            }

            if ($request->has('variants')) {

                foreach ($request->variants as $variantData) {

                    $variant = ProductVariant::create([
                        'id'         => Str::uuid(),
                        'product_id' => $product->id,
                        'sku'        => $variantData['sku'],
                        'barcode'    => $variantData['barcode'] ?? null,
                        'weight'     => $variantData['weight'] ?? 0,
                        'price'      => $variantData['price'],
                        'cost'       => $variantData['cost'],
                        'is_active'  => true,
                    ]);


                    if (isset($variantData['attribute_value_ids'])) {
                        foreach ($variantData['attribute_value_ids'] as $attributeValueId) {
                            VariantAttributeValue::create([
                                'variant_id'         => $variant->id,
                                'attribute_value_id' => $attributeValueId,
                            ]);
                        }
                    }

                    if (isset($variantData['sizes'])) {

                        foreach ($variantData['sizes'] as $size) {

                            VariantSize::create([

                                'variant_id' => $variant->id,
                                'size_id'    => $size['size_id'],
                                'fit_id'     => $size['fit_id'],
                            ]);
                        }
                    }

                    if (isset($variantData['inventories'])) {
                        foreach ($variantData['inventories'] as $inventory) {
                            Inventory::create([

                                'branch_id' => $inventory['branch_id'],
                                'variant_id'=> $variant->id,
                                'stock'     => $inventory['stock'],
                                'min_stock' => $inventory['min_stock'] ?? 0,
                            ]);
                        }
                    }


                    if (isset($variantData['measurements'])) {

                        foreach ($variantData['measurements'] as $measurement) {

                            VariantMeasurement::create([

                                'variant_id'          => $variant->id,
                                'size_id'             => $measurement['size_id'],
                                'measurement_type_id' => $measurement['measurement_type_id'],

                                'value'               => $measurement['value'],
                            ]);
                        }
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
                    'product_variants.variant_sizes',
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

                VariantSize::where('variant_id', $variant->id)->delete();

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
}