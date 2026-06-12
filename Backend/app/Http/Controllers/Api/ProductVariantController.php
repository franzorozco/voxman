<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catalog\ProductVariant;

class ProductVariantController extends Controller
{
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
}