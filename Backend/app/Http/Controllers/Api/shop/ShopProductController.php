<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Catalog\Product;

class ShopProductController extends Controller
{
    /**
     * Listar productos para la tienda online.
     * Carga las relaciones correctas de imágenes y variantes.
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
            'category'
        ])->where('is_active', true);

        // Filtro por categoría
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

        // Búsqueda por nombre
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->get('per_page', 24)));
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
            'bundle_items.variant.variant_images',
            'bundle_items.variant.variant_attribute_values.attribute_value.attribute',
            'bundle_items.variant.size',
            'bundle_items.variant.fit'
        ])->where('slug', $slug)
          ->orWhere('id', $slug)
          ->firstOrFail();

        return response()->json($product);
    }
}
