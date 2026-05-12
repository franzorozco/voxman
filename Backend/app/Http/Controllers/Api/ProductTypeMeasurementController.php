<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catalog\ProductTypeMeasurement;
use Illuminate\Http\Request;

class ProductTypeMeasurementController extends Controller
{
    public function index()
    {
        return response()->json(
            ProductTypeMeasurement::with([
                'productType',
                'measurementType'
            ])->get()
        );
    }

    public function show($id)
    {
        return response()->json(
            ProductTypeMeasurement::with([
                'productType',
                'measurementType'
            ])->findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        $item = ProductTypeMeasurement::create([
            'product_type_id' => $request->product_type_id,
            'measurement_type_id' => $request->measurement_type_id,
        ]);

        return response()->json($item, 201);
    }

    public function update(Request $request, $id)
    {
        $item = ProductTypeMeasurement::findOrFail($id);

        $item->update([
            'product_type_id' => $request->product_type_id,
            'measurement_type_id' => $request->measurement_type_id,
        ]);

        return response()->json($item);
    }

    public function destroy($id)
    {
        ProductTypeMeasurement::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Relación eliminada'
        ]);
    }
}