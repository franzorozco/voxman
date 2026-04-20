<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Auth\Role;

class RoleController extends Controller
{
    // 🔹 LISTAR
    public function index()
    {
        return Role::with('permissions')->get();
    }

    // 🔹 VER UNO
    public function show($id)
    {
        return Role::with('permissions')->findOrFail($id);
    }

    // 🔹 CREAR
    public function store(Request $request)
    {
        try {
            $role = Role::create([
                'name' => $request->name,
                'guard_name' => 'web'
            ]);

            // 🔥 asignar permisos
            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            return response()->json($role->load('permissions'), 201);

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

            // 🔥 sincroniza (agrega y elimina automáticamente)
            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            return response()->json($role->load('permissions'));

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
