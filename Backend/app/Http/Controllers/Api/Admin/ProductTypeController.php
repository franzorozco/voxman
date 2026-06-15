<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Catalog\ProductType;

class ProductTypeController extends Controller
{
    public function index()
    {
        return response()->json(
            ProductType::with('measurement_types')->whereNull('deleted_at')->get()
        );
    }

    public function show($id)
    {
        return response()->json(
            ProductType::with('measurement_types')->findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'measurements' => 'nullable|array',
            'measurements.*' => 'exists:measurement_types,id'
        ]);

        $productType = ProductType::create(['name' => $validated['name']]);

        if (isset($validated['measurements'])) {
            $productType->measurement_types()->sync($validated['measurements']);
        }

        $productType->load('measurement_types');

        return response()->json([
            'message' => 'Tipo de producto creado correctamente',
            'data' => $productType
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $productType = ProductType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'measurements' => 'nullable|array',
            'measurements.*' => 'exists:measurement_types,id'
        ]);

        $productType->update(['name' => $validated['name']]);

        if (isset($validated['measurements'])) {
            $productType->measurement_types()->sync($validated['measurements']);
        } else {
            // Si mandan vacío explícitamente y queremos limpiar o si no lo mandan.
            if ($request->has('measurements')) {
                $productType->measurement_types()->sync([]);
            }
        }

        $productType->load('measurement_types');

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