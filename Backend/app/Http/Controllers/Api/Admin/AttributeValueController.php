<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Catalog\AttributeValue;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
            AttributeValue::with('attribute')
                ->findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'attribute_id' => 'required|uuid',
            'value' => 'required|string|max:100',
            'hex_code' => 'nullable|string|max:7',
        ]);

        $value = new AttributeValue([
            'attribute_id' => $request->attribute_id,
            'value' => $request->value,
            'hex_code' => $request->hex_code,
        ]);
        $value->id = Str::uuid()->toString();
        $value->save();

        return response()->json($value, 201);
    }

    public function update(Request $request, $id)
    {
        $value = AttributeValue::findOrFail($id);

        $value->update([
            'attribute_id' => $request->attribute_id,
            'value' => $request->value,
            'hex_code' => $request->hex_code,
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