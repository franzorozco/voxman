<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Fit;
use Illuminate\Http\Request;

class FitController extends Controller
{
    public function index()
    {
        return response()->json(Fit::all());
    }

    public function show($id)
    {
        return response()->json(
            Fit::findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        $fit = Fit::create([
            'name' => $request->name,
        ]);

        return response()->json($fit, 201);
    }

    public function update(Request $request, $id)
    {
        $fit = Fit::findOrFail($id);

        $fit->update([
            'name' => $request->name,
        ]);

        return response()->json($fit);
    }

    public function destroy($id)
    {
        Fit::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Fit eliminado'
        ]);
    }
}