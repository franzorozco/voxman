<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Auth\Permission;

class PermissionController extends Controller
{
    // LISTAR
    public function index()
    {
        return Permission::all();
    }

    public function show($id)
    {
        return Permission::findOrFail($id);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:permissions,name'
        ]);

        $permission = Permission::create([
            'name' => $request->name,
            'guard_name' => 'web'
        ]);

        return response()->json($permission, 201);
    }

    public function update(Request $request, $id)
    {
        return response()->json([
            'error' => 'No está permitido editar permisos del sistema porque podría romper la seguridad.'
        ], 403);
    }

    public function destroy($id)
    {
        return response()->json([
            'error' => 'No está permitido eliminar permisos del sistema porque podría romper la seguridad.'
        ], 403);
    }
}