<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    // 🔹 LISTAR
    public function index()
    {
        return Role::all();
    }

    // 🔹 VER UNO
    public function show($id)
    {
        return Role::findOrFail($id);
    }

    // 🔹 CREAR
    public function store(Request $request)
    {
        try {
            $role = Role::create([
                'name' => $request->name,
                'guard_name' => 'web'
            ]);

            return response()->json($role, 201);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 🔹 ACTUALIZAR
    public function update(Request $request, $id)
    {
        try {
            $role = Role::findOrFail($id);

            $role->update([
                'name' => $request->name
            ]);

            return response()->json($role);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 🔹 ELIMINAR
    public function destroy($id)
    {
        try {
            $role = Role::findOrFail($id);
            $role->delete();

            return response()->json(['message' => 'Rol eliminado']);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
