<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Actors\Owner;

class OwnerController extends Controller
{
    public function index()
    {
        $owners = Owner::with('user')->whereNull('deleted_at')->get();

        return response()->json($owners);
    }

    public function show($id)
    {
        $owner = Owner::with('user')->findOrFail($id);

        return response()->json($owner);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|uuid|exists:users,id|unique:owners,user_id',
            'is_active' => 'boolean'
        ]);

        $owner = Owner::create($validated);

        return response()->json([
            'message' => 'Owner creado correctamente',
            'data' => $owner
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $owner = Owner::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'sometimes|uuid|exists:users,id|unique:owners,user_id,' . $id,
            'is_active' => 'boolean'
        ]);

        $owner->update($validated);

        return response()->json([
            'message' => 'Owner actualizado correctamente',
            'data' => $owner
        ]);
    }

    public function destroy($id)
    {
        $owner = Owner::findOrFail($id);

        $owner->delete();

        return response()->json([
            'message' => 'Owner eliminado correctamente'
        ]);
    }
}