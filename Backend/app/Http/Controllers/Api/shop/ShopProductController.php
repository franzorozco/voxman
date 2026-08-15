<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Catalog\Product;

class ShopProductController extends Controller
{
    public function index(Request $request)
    {
        // Query param filters can be applied here
        $query = Product::with(['images', 'variants', 'brand', 'category']);
        
        // E.g., filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Only return active/published products
        // Assuming there is an 'is_active' or similar column. Adjust as needed.
        // $query->where('is_active', true);

        return response()->json($query->paginate(12));
    }

    public function show($slug)
    {
        // We assume 'id' or 'slug'. Let's use ID for now or find by slug.
        // Adjust column name based on your schema.
        $product = Product::with(['images', 'variants.attributes', 'brand', 'category'])->findOrFail($slug);
        return response()->json($product);
    }
}
