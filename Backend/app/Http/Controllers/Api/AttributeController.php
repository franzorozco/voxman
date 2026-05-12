<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Attribute;

use Illuminate\Http\Request;

class AttributeController extends Controller
{
    public function index()
    {
        return response()->json(
            Attribute::with('attributeValues')->get()
        );
    }

    public function show($id)
    {
        return response()->json(
            Attribute::with('attributeValues')->findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        $attribute = Attribute::create([
            'name' => $request->name,
        ]);

        return response()->json($attribute, 201);
    }

    public function update(Request $request, $id)
    {
        $attribute = Attribute::findOrFail($id);

        $attribute->update([
            'name' => $request->name,
        ]);

        return response()->json($attribute);
    }

    public function destroy($id)
    {
        $attribute = Attribute::findOrFail($id);

        $attribute->delete();

        return response()->json([
            'message' => 'Atributo eliminado'
        ]);
    }
}