<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Catalog\Attribute;

class AttributeController extends Controller
{
    public function index()
    {
        return response()->json(
            Attribute::with('attribute_values')->get()
        );
    }

    public function show($id)
    {
        return response()->json(
            Attribute::findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'is_fixed' => 'nullable|boolean'
        ]);
        $attribute = Attribute::create($validated);
        return response()->json([
            'message' => 'Atributo creado correctamente',
            'data' => $attribute
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $attribute = Attribute::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'is_fixed' => 'nullable|boolean'
        ]);
        $attribute->update($validated);
        return response()->json([
            'message' => 'Atributo actualizado correctamente',
            'data' => $attribute
        ]);
    }

    public function destroy($id)
    {
        $attribute = Attribute::findOrFail($id);
        $attribute->delete();
        return response()->json([
            'message' => 'Atributo eliminado correctamente'
        ]);
    }
}