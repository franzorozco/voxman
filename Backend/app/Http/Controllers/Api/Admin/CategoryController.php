<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Category;

class CategoryController extends Controller
{
    public function index()
    {
        // Get all categories and load their parent to show in the frontend list
        $categories = Category::with('category')->get();
        return response()->json($categories);
    }

    public function show($id)
    {
        return response()->json(Category::with('category')->findOrFail($id));
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'parent_id' => 'nullable|uuid|exists:categories,id'
        ]);

        $category = Category::create($validated);

        return response()->json([
            'message' => 'Categoría creada',
            'data' => $category
        ], 201);
    }

    public function update(\Illuminate\Http\Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'parent_id' => 'nullable|uuid|exists:categories,id'
        ]);

        // Evitar que sea padre de si misma
        if ($validated['parent_id'] == $category->id) {
            return response()->json(['message' => 'Una categoría no puede ser padre de sí misma', 'field' => 'parent_id'], 422);
        }

        $category->update($validated);

        return response()->json([
            'message' => 'Categoría actualizada',
            'data' => $category
        ]);
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        
        // Comprobar si tiene hijos o productos
        if ($category->categories()->count() > 0) {
            return response()->json(['message' => 'No se puede eliminar porque tiene subcategorías'], 409);
        }

        if ($category->products()->count() > 0) {
            return response()->json(['message' => 'No se puede eliminar porque tiene productos asociados'], 409);
        }

        $category->delete();

        return response()->json(['message' => 'Categoría eliminada']);
    }
} 