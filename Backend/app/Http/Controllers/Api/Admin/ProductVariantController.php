<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Catalog\ProductVariant;

class ProductVariantController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $query = ProductVariant::with(['product', 'variant_attribute_values.attribute_value.attribute'])
                    ->where('is_active', true);
                    
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('sku', 'ILIKE', "%{$search}%")
                  ->orWhere('barcode', 'ILIKE', "%{$search}%")
                  ->orWhereHas('product', function ($q2) use ($search) {
                      $q2->where('name', 'ILIKE', "%{$search}%");
                  });
            });
        }
        
        $variants = $query->paginate($request->per_page ?? 50);
        return response()->json($variants);
    }

    public function deleted()
    {
        $variants = ProductVariant::onlyTrashed()
            ->with([
                'product',
                'variant_attribute_values.attribute_value.attribute',
                'size',
                'fit'
            ])
            ->orderBy('deleted_at', 'desc')
            ->get();
            
        return response()->json(['data' => $variants]);
    }

    public function show($id)
    {
        $variant = ProductVariant::with([

            'attributeValues.attribute',
            'sizes',
            'fits',
            'inventories.branch',
            'variantImages',

        ])->findOrFail($id);

        return response()->json($variant);
    }

    public function update(\Illuminate\Http\Request $request, $id)
    {
        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $variant = ProductVariant::findOrFail($id);
            if ($request->has('price')) $variant->price = $request->price === '' ? 0 : $request->price;
            if ($request->has('cost')) $variant->cost = $request->cost === '' ? 0 : $request->cost;
            if ($request->has('weight')) $variant->weight = $request->weight === '' ? 0 : $request->weight;
            if ($request->has('size_id')) $variant->size_id = empty($request->size_id) ? null : $request->size_id;
            if ($request->has('fit_id')) $variant->fit_id = empty($request->fit_id) ? null : $request->fit_id;
            
            $variant->save();

            if ($request->has('attribute_value_ids')) {
                \App\Models\Catalog\VariantAttributeValue::where('variant_id', $variant->id)->delete();
                foreach ($request->attribute_value_ids as $attrValId) {
                    \App\Models\Catalog\VariantAttributeValue::create([
                        'variant_id' => $variant->id,
                        'attribute_value_id' => $attrValId
                    ]);
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Variante actualizada correctamente',
                'variant' => ProductVariant::with([
                    'variant_attribute_values.attribute_value.attribute',
                    'size',
                    'fit',
                    'inventories.branch',
                    'variant_images',
                    'variant_measurements.measurement_type'
                ])->find($variant->id)
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Variant update error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'message' => 'Error al actualizar variante',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}