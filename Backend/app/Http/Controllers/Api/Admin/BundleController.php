<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Catalog\Product;
use App\Models\Catalog\BundleItem;

class BundleController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::where('is_bundle', true)
            ->with([
                'bundle_items.product.owner.user.profile',
                'bundle_items.product.product_images', 
                'bundle_items.product.attribute_value_images',
                'bundle_items.product.product_variants.inventories',
                'bundle_items.variant.product.owner.user.profile',
                'bundle_items.variant.variant_attribute_values.attribute_value.attribute',
                'bundle_items.variant.variant_images',
                'bundle_items.variant.inventories',
                'product_images'
            ]);
            
        if ($request->filled('search')) {
            $query->where('name', 'ILIKE', "%{$request->search}%");
        }

        return response()->json($query->paginate(12));
    }

    public function show($id)
    {
        $bundle = Product::where('is_bundle', true)
            ->with([
                'bundle_items.product.owner.user.profile',
                'bundle_items.product.product_images', 
                'bundle_items.product.attribute_value_images',
                'bundle_items.product.product_variants.inventories',
                'bundle_items.variant.product.owner.user.profile',
                'bundle_items.variant.variant_attribute_values.attribute_value.attribute',
                'bundle_items.variant.variant_images',
                'bundle_items.variant.inventories',
                'product_images'
            ])
            ->findOrFail($id);
            
        return response()->json($bundle);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $bundle = Product::create([
                'id'              => Str::uuid(),
                'owner_id'        => $request->owner_id,
                'category_id'     => $request->category_id,
                'product_type_id' => $request->product_type_id,
                'brand_id'        => $request->brand_id,
                'name'            => $request->name,
                'description'     => $request->description,
                'slug'            => Str::slug($request->name),
                'base_price'      => $request->base_price ?? 0,
                'is_active'       => $request->boolean('is_active', true),
                'is_bundle'       => true,
                'views'           => 0,
            ]);

            if ($request->hasFile('product_images')) {
                foreach ($request->file('product_images') as $file) {
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('catalog/bundles', $filename, 's3');

                    $image = new \App\Models\Catalog\ProductImage([
                        'product_id' => $bundle->id,
                        'url'        => '/storage/' . $filePath,
                        'is_main'    => false,
                    ]);
                    $image->id = Str::uuid()->toString();
                    $image->save();
                }
            }

            $items = $request->input('bundle_items', []);
            if (is_string($items)) {
                $items = json_decode($items, true) ?: [];
            }
            
            foreach ($items as $item) {
                BundleItem::create([
                    'id'         => Str::uuid(),
                    'bundle_id'  => $bundle->id,
                    'product_id' => $item['product_id'] ?? null,
                    'variant_id' => $item['variant_id'] ?? null,
                    'quantity'   => $item['quantity'] ?? 1,
                ]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Conjunto creado correctamente', 
                'bundle' => Product::with([
                'bundle_items.product.product_images', 
                'bundle_items.product.attribute_value_images',
                'bundle_items.product.product_variants.inventories',
                'bundle_items.variant.variant_attribute_values.attribute_value.attribute', 
                'bundle_items.variant.variant_images',
                'bundle_items.variant.inventories',
                'product_images'
                ])->find($bundle->id)
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Bundle Store Error: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear conjunto', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $bundle = Product::where('is_bundle', true)->findOrFail($id);
            
            $bundle->update($request->only([
                'name', 'description', 'base_price', 'category_id', 'owner_id', 'brand_id'
            ]));

            if ($request->has('is_active')) {
                $bundle->is_active = $request->boolean('is_active');
                $bundle->save();
            }
            
            if ($request->has('name')) {
                $bundle->slug = Str::slug($request->name);
                $bundle->save();
            }

            if ($request->hasFile('product_images')) {
                // Remove old images when uploading new ones (optional, or just add them)
                // We'll replace all if new ones are uploaded like in ProductController
                \App\Models\Catalog\ProductImage::where('product_id', $bundle->id)->delete();
                foreach ($request->file('product_images') as $file) {
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('catalog/bundles', $filename, 's3');

                    $image = new \App\Models\Catalog\ProductImage([
                        'product_id' => $bundle->id,
                        'url'        => '/storage/' . $filePath,
                        'is_main'    => false,
                    ]);
                    $image->id = Str::uuid()->toString();
                    $image->save();
                }
            }

            if ($request->has('bundle_items')) {
                $items = $request->input('bundle_items');
                if (is_string($items)) {
                    $items = json_decode($items, true) ?: [];
                }

                BundleItem::where('bundle_id', $bundle->id)->delete();
                foreach ($items as $item) {
                    BundleItem::create([
                        'id'         => Str::uuid(),
                        'bundle_id'  => $bundle->id,
                        'product_id' => $item['product_id'] ?? null,
                        'variant_id' => $item['variant_id'] ?? null,
                        'quantity'   => $item['quantity'] ?? 1,
                    ]);
                }
            }

            DB::commit();
            return response()->json([
                'message' => 'Conjunto actualizado', 
                'bundle' => Product::with([
                    'bundle_items.product.product_images', 
                    'bundle_items.product.attribute_value_images',
                    'bundle_items.product.product_variants.inventories',
                    'bundle_items.variant.variant_attribute_values.attribute_value.attribute', 
                    'bundle_items.variant.variant_images',
                    'bundle_items.variant.inventories',
                    'product_images'
                ])->find($bundle->id)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Bundle Update Error: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar conjunto', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $bundle = Product::where('is_bundle', true)->findOrFail($id);
        $bundle->delete();
        return response()->json(['message' => 'Conjunto eliminado']);
    }
}
