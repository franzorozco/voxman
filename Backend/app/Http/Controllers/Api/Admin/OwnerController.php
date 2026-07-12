<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Actors\Owner;

class OwnerController extends Controller
{
    public function index()
    {
        return Owner::with(['user.profile', 'user.roles'])
            ->withCount(['products'])
            ->where('is_active', true)
            ->whereHas('user', function ($q) {
                $q->where('is_active', true);
            })
            ->get();
    }

    public function show($id)
    {
        $owner = Owner::with('user')->findOrFail($id);

        return response()->json($owner);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean'
        ]);

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            $isActive = $request->has('is_active') ? $request->boolean('is_active') : true;

            $user = \App\Models\Core\User::create([
                'email' => $request->email,
                'password' => \Illuminate\Support\Facades\Hash::make($request->password),
                'is_active' => $isActive
            ]);

            \App\Models\Core\UserProfile::create([
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'last_name_paternal' => $request->last_name_paternal,
                'last_name_maternal' => $request->last_name_maternal,
                'phone' => $request->phone,
            ]);
            
            $owner = Owner::create([
                'user_id' => $user->id,
                'is_active' => $isActive
            ]);

            $user->assignRole('Owner');

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Owner creado correctamente',
                'data' => Owner::with('user.profile')->find($owner->id)
            ], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Error creando owner', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $owner = Owner::findOrFail($id);
        $user = $owner->user;
        $profile = $user->profile;

        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean'
        ]);

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            $updateData = [];
            
            // Verificamos si el usuario actual tiene permisos para modificar credenciales
            $canManageCredentials = $request->user() && $request->user()->can('manage_owners_credentials');

            if ($request->has('email') && !empty($request->email)) {
                if ($canManageCredentials) {
                    $updateData['email'] = $request->email;
                } else if ($request->email !== $user->email) {
                    throw new \Exception("No tienes permiso para modificar el correo electrónico.");
                }
            }
            
            if ($request->has('is_active')) {
                $isActive = $request->boolean('is_active');
                $updateData['is_active'] = $isActive;
                $owner->update([
                    'is_active' => $isActive
                ]);
            }

            if (!empty($updateData)) {
                $user->update($updateData);
            }

            if ($request->has('password') && !empty($request->password)) {
                if ($canManageCredentials) {
                    $user->update(['password' => \Illuminate\Support\Facades\Hash::make($request->password)]);
                } else {
                    throw new \Exception("No tienes permiso para modificar la contraseña.");
                }
            }

            if ($profile) {
                $profile->update([
                    'first_name' => $request->first_name,
                    'last_name_paternal' => $request->last_name_paternal,
                    'last_name_maternal' => $request->last_name_maternal,
                    'phone' => $request->phone
                ]);
            } else {
                \App\Models\Core\UserProfile::create([
                    'user_id' => $user->id,
                    'first_name' => $request->first_name,
                    'last_name_paternal' => $request->last_name_paternal,
                    'last_name_maternal' => $request->last_name_maternal,
                    'phone' => $request->phone,
                ]);
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Owner actualizado correctamente',
                'data' => Owner::with('user.profile')->find($owner->id)
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Error actualizando owner', 'error' => $e->getMessage()], 500);
        }
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