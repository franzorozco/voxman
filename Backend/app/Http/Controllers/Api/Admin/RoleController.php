<?php
 
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Auth\Role;

class RoleController extends Controller
{
    public function index()
    {
        return Role::with('permissions')->get();
    }

    public function show($id)
    {
        return Role::with('permissions')->findOrFail($id);
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string',
                'is_employee' => 'boolean',
                'is_customer' => 'boolean',
            ]);

            if ($request->is_employee && $request->is_customer) {
                return response()->json(['error' => 'Un rol no puede ser de empleado y cliente a la vez'], 422);
            }

            $role = Role::create([
                'name' => $request->name,
                'guard_name' => 'web',
                'is_employee' => $request->is_employee ?? false,
                'is_customer' => $request->is_customer ?? false,
            ]);

            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            return response()->json($role->load('permissions'), 201);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'name' => 'required|string',
                'is_employee' => 'boolean',
                'is_customer' => 'boolean',
            ]);

            if ($request->is_employee && $request->is_customer) {
                return response()->json(['error' => 'Un rol no puede ser de empleado y cliente a la vez'], 422);
            }

            $role = Role::findOrFail($id);

            $role->update([
                'name' => $request->name,
                'is_employee' => $request->is_employee ?? false,
                'is_customer' => $request->is_customer ?? false,
            ]);

            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            return response()->json($role->load('permissions'));

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

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
