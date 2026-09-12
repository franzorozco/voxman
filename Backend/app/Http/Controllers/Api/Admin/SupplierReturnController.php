<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Purchase\SupplierReturn;

class SupplierReturnController extends Controller
{
    public function index()
    {
        $returns = SupplierReturn::with([
            'supplier',
            'purchase',
            'variant.product.product_images',
            'variant.product.attribute_value_images',
            'variant.variant_images',
            'variant.variant_attribute_values'
        ])->orderBy('created_at', 'desc')->get();

        return response()->json($returns);
    }
}
