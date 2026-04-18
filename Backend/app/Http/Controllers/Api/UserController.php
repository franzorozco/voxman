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
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;

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

        $request->validate([
            'email' => 'required|email|unique:users,email',
            'username' => 'required|unique:users,username',
            'password' => 'required|min:6',
            'roles' => 'array',
            'roles.*' => 'exists:roles,name',
            'type' => 'nullable|in:owner,customer',
            'first_name' => 'required|string|max:100',

            // 🔥 VALIDACIÓN CUSTOMER
            'customer.customer_code' => 'required_if:type,customer|string|max:20|unique:customers,customer_code',
        ]);

        // USER
        $user = User::create([
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'is_active' => $request->is_active ?? true
        ]);

        // PROFILE
        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => $request->first_name,
            'last_name_paternal' => $request->last_name_paternal,
            'last_name_maternal' => $request->last_name_maternal,
            'phone' => $request->phone,
            'birthdate' => $request->birthdate,
            'gender' => $request->gender
        ]);

        // ROLES
        if ($request->filled('roles')) {
            $user->syncRoles($request->roles);
        }

        // TYPE
        if ($request->type === 'owner') {

            Owner::create([
                'user_id' => $user->id
            ]);

        } elseif ($request->type === 'customer') {

            Customer::create([
                'user_id' => $user->id,
                'customer_code' => $request->customer['customer_code'],
                'points' => $request->customer['points'] ?? 0,
                'total_purchases' => $request->customer['total_purchases'] ?? 0,
            ]);
        }

        DB::commit();

        return response()->json(
            $user->load('profile', 'roles', 'owner', 'customer'),
            201
        );

    } catch (\Exception $e) {
        DB::rollBack();

        return response()->json([
            'error' => $e->getMessage()
        ], 500);
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

        // ROLES
        if ($request->has('roles')) {
            $user->syncRoles($request->roles ?? []);
        }

    // TYPE LIMPIO
    if ($request->has('type')) {

        if ($request->type === 'customer') {

            // eliminar owner
            DB::table('owners')->where('user_id', $user->id)->delete();

            $request->validate([
                'customer.customer_code' => 'required|string|max:20|unique:customers,customer_code,' . $user->id . ',user_id'
            ]);
            Customer::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'customer_code' => $request->customer['customer_code'],
                    'points' => $request->customer['points'] ?? 0,
                    'total_purchases' => $request->customer['total_purchases'] ?? 0,
                ]
            );

        } elseif ($request->type === 'owner') {

            // eliminar customer
            DB::table('customers')->where('user_id', $user->id)->delete();

            Owner::updateOrCreate(
                ['user_id' => $user->id],
                []
            );
        }
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





    public function reportPdf(Request $request)
    {
        $query = User::with(['profile', 'roles', 'owner', 'customer']);

        // =========================
        // 🔎 FILTROS (IGUAL FRONTEND)
        // =========================

        if ($request->search) {
            $q = $request->search;

            $query->where(function ($u) use ($q) {
                $u->where('email', 'like', "%$q%")
                ->orWhere('username', 'like', "%$q%");
            });
        }

        if ($request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->type !== 'all') {
            if ($request->type === 'owner') {
                $query->whereHas('owner');
            }

            if ($request->type === 'customer') {
                $query->whereHas('customer');
            }
        }

        if ($request->role !== 'all') {
            $query->whereHas('roles', function ($r) use ($request) {
                $r->where('name', $request->role);
            });
        }

        if ($request->minPoints !== null) {
            $query->whereHas('customer', function ($c) use ($request) {
                $c->where('points', '>=', $request->minPoints);
            });
        }

        if ($request->maxPoints !== null) {
            $query->whereHas('customer', function ($c) use ($request) {
                $c->where('points', '<=', $request->maxPoints);
            });
        }

        // =========================
        // 📊 SORT
        // =========================
        switch ($request->sort) {
            case "created_at_asc":
                $query->orderBy('created_at', 'asc');
                break;

            case "created_at_desc":
                $query->orderBy('created_at', 'desc');
                break;
        }

        $users = $query->get();
        $authUser = auth('sanctum')->user();
        
        // =========================
        // 📄 PDF VIEW
        // =========================
        $pdf = Pdf::loadView('reports.users', [
            'users' => $users,
            'filters' => $request->all(),
            'authUser' => $authUser
        ])->setPaper('A4', 'landscape');

        return $pdf->stream("reporte-usuarios.pdf");
    }
}