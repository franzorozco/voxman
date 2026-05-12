<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catalog\MeasurementType;
use Illuminate\Http\Request;

class MeasurementTypeController extends Controller
{
    public function index()
    {
        return response()->json(
            MeasurementType::all()
        );
    }

    public function show($id)
    {
        return response()->json(
            MeasurementType::findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        $measurement = MeasurementType::create([
            'name' => $request->name,
        ]);

        return response()->json($measurement, 201);
    }

    public function update(Request $request, $id)
    {
        $measurement = MeasurementType::findOrFail($id);

        $measurement->update([
            'name' => $request->name,
        ]);

        return response()->json($measurement);
    }

    public function destroy($id)
    {
        MeasurementType::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Measurement eliminado'
        ]);
    }
}