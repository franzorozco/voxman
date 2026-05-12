<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catalog\AttributeValue;
use Illuminate\Http\Request;

class AttributeValueController extends Controller
{
    public function index()
    {
        return response()->json(
            AttributeValue::with('attribute')->get()
        );
    }

    public function show($id)
    {
        return response()->json(
            AttributeValue::with('attribute')->findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        $value = AttributeValue::create([
            'attribute_id' => $request->attribute_id,
            'value' => $request->value,
        ]);

        return response()->json($value, 201);
    }

    public function update(Request $request, $id)
    {
        $value = AttributeValue::findOrFail($id);

        $value->update([
            'attribute_id' => $request->attribute_id,
            'value' => $request->value,
        ]);

        return response()->json($value);
    }

    public function destroy($id)
    {
        AttributeValue::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Valor eliminado'
        ]);
    }
}