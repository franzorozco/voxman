<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Catalog\ProductType;

class ProductTypeController extends Controller
{
    public function index()
    {
        return response()->json(
            ProductType::whereNull('deleted_at')->get()
        );
    }

    public function show($id)
    {
        return response()->json(
            ProductType::findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100'
        ]);

        $productType = ProductType::create($validated);

        return response()->json([
            'message' => 'Tipo de producto creado correctamente',
            'data' => $productType
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $productType = ProductType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100'
        ]);

        $productType->update($validated);

        return response()->json([
            'message' => 'Tipo de producto actualizado correctamente',
            'data' => $productType
        ]);
    }

    public function destroy($id)
    {
        $productType = ProductType::findOrFail($id);

        $productType->delete();

        return response()->json([
            'message' => 'Tipo de producto eliminado correctamente'
        ]);
    }
}