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
use Illuminate\Validation\Rule;


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

        // 🔍 BUSCAR INCLUSO ELIMINADOS
        $existingUser = User::withTrashed()
        ->where('email', $request->email)
        ->first();

        // 🚨 SI EXISTE Y ESTÁ ELIMINADO
        if ($existingUser && $existingUser->trashed()) {

            if (!$request->action) {
                return response()->json([
                    'soft_deleted' => true,
                    'user' => $existingUser->load('profile', 'roles'),
                    'message' => 'Usuario eliminado encontrado'
                ], 409);
            }

            // 🔄 RESTORE
            if ($request->action === 'restore') {

                $existingUser->restore();

                DB::commit();

                return response()->json([
                    'message' => 'Usuario reactivado',
                    'user' => $existingUser->load('profile', 'roles')
                ]);
            }

            // ✏️ OVERWRITE
            if ($request->action === 'overwrite') {

                $existingUser->restore();

                $existingUser->update([
                    'email' => $request->email,
                    'username' => $request->username,
                    'password' => Hash::make($request->password),
                    'is_active' => $request->is_active ?? true
                ]);

                // PROFILE
                $existingUser->profile()->updateOrCreate(
                    ['user_id' => $existingUser->id],
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
                if ($request->filled('roles')) {
                    $existingUser->syncRoles($request->roles);
                }

                DB::commit();

                return response()->json([
                    'message' => 'Usuario restaurado y actualizado',
                    'user' => $existingUser->load('profile', 'roles')
                ]);
            }
        }

        // 🔍 BUSCAR USERNAME EXISTENTE (INCLUSO ELIMINADOS)
        $existingUsername = User::withTrashed()
            ->where('username', $request->username)
            ->first();

        if ($existingUsername && !$existingUsername->trashed()) {

            // 🔥 GENERAR SUGERENCIAS
            $suggestions = [];
            for ($i = 1; $i <= 5; $i++) {
                $suggestions[] = $request->username . rand(10, 999);
            }

            return response()->json([
                'field' => 'username',
                'message' => 'Este username ya está en uso',
                'suggestions' => $suggestions
            ], 422);
        }

        // ✅ VALIDACIÓN NORMAL (SOLO NO ELIMINADOS)
        $request->validate([
            'email' => [
                'required',
                'email',
                Rule::unique('users')->ignore($id)->whereNull('deleted_at')
            ],
            'username' => [
                'required',
                'string',
                'max:50',
                Rule::unique('users')->ignore($id)->whereNull('deleted_at'),
                'regex:/^[a-zA-Z0-9_]+$/'
            ],
        ]);

        // 🆕 CREACIÓN NORMAL
        $user = User::create([
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'is_active' => $request->is_active ?? true
        ]);

        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => $request->first_name,
            'phone' => $request->phone,
        ]);

        if ($request->filled('roles')) {
            $user->syncRoles($request->roles);
        }

        DB::commit();

        return response()->json($user->load('profile','roles'), 201);

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

        // 🔍 VALIDAR USERNAME DUPLICADO (EXCLUYENDO EL MISMO USUARIO)
        $existingUsername = User::withTrashed()
            ->where('username', $request->username)
            ->where('id', '!=', $id)
            ->first();

        if ($existingUsername) {

            // 🔥 generar sugerencias
            $suggestions = [];
            for ($i = 1; $i <= 5; $i++) {
                $suggestions[] = $request->username . rand(10, 999);
            }

            return response()->json([
                'field' => 'username',
                'message' => 'Este username ya está en uso',
                'suggestions' => $suggestions
            ], 422);
        }

        // USER
        $user->update([
            'email' => $request->email,
            'username' => $request->username,
            'is_active' => $request->is_active
        ]);

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

        if ($request->has('roles')) {
            $user->syncRoles($request->roles ?? []);
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

public function destroy(Request $request, $id)
{
    $user = User::with(['roles', 'owner'])->findOrFail($id);

    $authUser = $request->user();

    if (!$authUser) {
        return response()->json(['error' => 'No autenticado'], 401);
    }

    // 🚫 NO eliminarse a sí mismo
    if ($authUser->id === $user->id) {
        return response()->json([
            'error' => 'No puedes eliminar tu propia cuenta'
        ], 403);
    }

    // 🚫 NO eliminar ADMIN
    if ($user->roles->contains('name', 'Administrador')) {
        return response()->json([
            'error' => 'No puedes eliminar usuarios Administradores'
        ], 403);
    }

    // 🚫 NO eliminar OWNER
    if ($user->owner) {
        return response()->json([
            'error' => 'No puedes eliminar usuarios Owner'
        ], 403);
    }

    $user->delete();

    return response()->json(['message' => 'Usuario eliminado']);
}


        public function reportPdf(Request $request)
        {
            $query = User::with(['profile', 'roles', 'owner', 'customer']);

            // =========================
            // 🔐 AUTH (OBLIGATORIO PRIMERO)
            // =========================
            $authUser = $request->user();

            if (!$authUser) {
                abort(401, 'No autenticado');
            }

            $authUser->load(['profile', 'roles']);

            // =========================
            // 🔎 FILTROS
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

            if ($request->minPoints !== null && $request->minPoints !== '') {
                $query->whereHas('customer', function ($c) use ($request) {
                    $c->where('points', '>=', $request->minPoints);
                });
            }

            if ($request->maxPoints !== null && $request->maxPoints !== '') {
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
                default:
                    $query->orderBy('created_at', 'desc');
                    break;
            }

            // =========================
            // 📦 DATA
            // =========================
            $users = $query->get();

            // =========================
            // 📄 PDF
            // =========================
            $pdf = Pdf::loadView('reports.users', [
                'users' => $users,
                'filters' => $request->all(),
                'authUser' => $authUser
            ])->setPaper('A4', 'landscape');

        return $pdf->stream("reporte-usuarios.pdf");
        }




    public function pdf(Request $request, $id)
    {
        try {

            $user = User::with(['profile','roles','customer','owner'])
                ->findOrFail($id);

            $pdf = Pdf::loadView('reports.unit', [
                'user' => $user,
                'authUser' => $request->user(),
                'generatedAt' => now()
            ]);

            return $pdf->download("usuario_{$id}.pdf");

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error generando PDF',
                'details' => $e->getMessage()
            ], 500);
        }
    }

}