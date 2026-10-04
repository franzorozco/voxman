<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Size;
use Illuminate\Http\Request;

class SizeController extends Controller
{
    public function index()
    {
        return response()->json(Size::all());
    }

    public function show($id)
    {
        return response()->json(
            Size::findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        $size = new Size([
            'name' => $request->name,
            'description' => $request->description,
        ]);
        $size->id = \Illuminate\Support\Str::uuid()->toString();
        $size->save();

        return response()->json($size, 201);
    }

    public function update(Request $request, $id)
    {
        $size = Size::findOrFail($id);

        $size->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json($size);
    }

    public function destroy($id)
    {
        Size::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Talla eliminada'
        ]);
    }
}