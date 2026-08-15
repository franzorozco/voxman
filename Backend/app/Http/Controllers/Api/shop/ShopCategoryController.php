<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Catalog\Category;

class ShopCategoryController extends Controller
{
    public function index()
    {
        // Fetch categories to build the shop menu
        // Assuming you might want to load children or specific structure
        $categories = Category::all(); // Add 'with' logic if you have nested categories
        
        return response()->json($categories);
    }
}
