<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Core\User;
use App\Models\Core\UserProfile;
use App\Models\Actors\Owner;
use App\Models\Actors\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Models;

class UserController extends Controller
{
    // 🔹 LISTAR
    public function index()
    {
        return User::with(['profile', 'roles', 'owner', 'customer'])
            ->whereNull('deleted_at')
            ->get();
    }

    // 🔹 VER UNO
    public function show($id)
    {
        return User::with(['profile', 'roles', 'owner', 'customer'])
            ->findOrFail($id);
    }

    // 🔹 CREAR
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            $user = User::create([
                'email' => $request->email,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'is_active' => $request->is_active ?? true
            ]);

            // Perfil
            UserProfile::create([
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'last_name_paternal' => $request->last_name_paternal,
                'last_name_maternal' => $request->last_name_maternal,
                'phone' => $request->phone,
                'birthdate' => $request->birthdate,
                'gender' => $request->gender
            ]);

            // Roles
            if ($request->roles) {
                $user->syncRoles($request->roles);
            }

            // Tipo
            if ($request->type === 'owner') {
                Owner::create(['user_id' => $user->id]);
            }

            if ($request->type === 'customer') {
                Customer::create([
                    'user_id' => $user->id,
                    'customer_code' => uniqid('CUST-')
                ]);
            }
            

            // 🔹 TIPO (owner / customer)

            $type = $request->type;

            Owner::where('user_id', $user->id)->delete();
            Customer::where('user_id', $user->id)->delete();

            if ($type === 'owner') {
                Owner::create(['user_id' => $user->id]);
            } elseif ($type === 'customer') {
                Customer::create([
                    'user_id' => $user->id,
                    'customer_code' => uniqid('CUST-')
                ]);
            }

            DB::commit();

            return response()->json($user->load('profile', 'roles'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 🔹 ACTUALIZAR
public function update(Request $request, $id)
{
    DB::beginTransaction();

    try {
        $user = User::findOrFail($id);

        // USER
        $user->update([
            'email' => $request->email,
            'username' => $request->username,
            'is_active' => $request->is_active
        ]);

        // PASSWORD
        if ($request->filled('password')) {
            $user->update([
                'password' => Hash::make($request->password)
            ]);
        }

        // PROFILE
        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'first_name' => $request->first_name,
                'last_name_paternal' => $request->last_name_paternal,
                'last_name_maternal' => $request->last_name_maternal,
                'phone' => $request->phone,
                'birthdate' => $request->birthdate,
                'gender' => $request->gender,
            ]
        );

        // ROLES (IMPORTANTE FIX)
        if ($request->filled('roles')) {
            $user->syncRoles($request->roles);
        }

        // TYPE FIX LIMPIO
        $type = $request->type;

        // borrar ambos siempre
        Owner::where('user_id', $user->id)->delete();
        Customer::where('user_id', $user->id)->delete();

        // recrear según type
        if ($type === 'owner') {
            Owner::create(['user_id' => $user->id]);
        }

        if ($type === 'customer') {
            Customer::create([
                'user_id' => $user->id,
                'customer_code' => uniqid('CUST-')
            ]);
        }

        DB::commit();

        return response()->json(
            $user->load('profile', 'roles', 'owner', 'customer')
        );

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
    
    // 🔹 ELIMINAR (SOFT DELETE)
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Usuario eliminado']);
    }
}