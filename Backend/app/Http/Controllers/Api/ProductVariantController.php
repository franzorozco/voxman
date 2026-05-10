<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catalog\ProductVariant;

class ProductVariantController extends Controller
{
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