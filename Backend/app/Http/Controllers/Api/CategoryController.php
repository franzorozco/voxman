<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Category;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::with('categories')
            ->whereNull('parent_id')
            ->get();

        return response()->json($categories);
    }
} 