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
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\Rule;

 
class UserController extends Controller
{
    public function index()
    {
        return User::with(['profile', 'roles', 'owner', 'customer', 'employee'])
            ->whereNull('deleted_at')
            ->get();
    }

    public function show($id)
    {
        return User::with(['profile', 'roles', 'owner', 'customer', 'employee'])
             ->findOrFail($id);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();

        try {

            $request->validate([
                'email' => ['required','email'],
                'username' => ['required','regex:/^[a-zA-Z0-9_]+$/','max:50'],
                'password' => ['required','min:6'],
                'types' => ['nullable','array'],
                'types.*' => ['in:owner,customer,employee'],
            ]);

            $existingEmail = User::withTrashed()
                ->where('email', $request->email)
                ->first();

            if ($existingEmail) {

                if ($existingEmail->trashed() && $request->action === 'restore') {

                    $existingEmail->restore();

                    DB::commit();

                    return response()->json([
                        'message' => 'Usuario restaurado correctamente',
                        'user' => $existingEmail->load('profile','roles','owner','customer','employee')
                    ], 200);
                }

                if ($existingEmail->trashed() && $request->action === 'overwrite') {

                    $existingEmail->restore();

                    $existingEmail->update([
                        'email' => $request->email,
                        'username' => $request->username,
                        'password' => Hash::make($request->password),
                        'is_active' => true
                    ]);

                    $existingEmail->profile()->updateOrCreate(
                        ['user_id' => $existingEmail->id],
                        [
                            'first_name' => $request->first_name,
                            'last_name_paternal' => $request->last_name_paternal,
                            'last_name_maternal' => $request->last_name_maternal,
                            'phone' => $request->phone,
                            'birthdate' => $request->birthdate,
                            'gender' => $request->gender,
                        ]
                    );

                    if ($request->filled('roles')) {
                        $existingEmail->syncRoles($request->roles);
                    }

                    $types = $request->types ?? [];

                    $owner = Owner::withTrashed()
                        ->where('user_id', $existingEmail->id)
                        ->first();

                    if (in_array('owner', $types)) {
                        if ($owner) {
                            $owner->restore();
                            $owner->update(['is_active' => true]);
                        } else {
                            Owner::create([
                                'user_id' => $existingEmail->id,
                                'is_active' => true
                            ]);
                        }
                    } else {
                        if ($owner) $owner->update(['is_active' => false]);
                    }

                    // =========================
                    // CUSTOMER
                    // =========================
                    $customer = Customer::withTrashed()
                        ->where('user_id', $existingEmail->id)
                        ->first();

                    if (in_array('customer', $types)) {

                        $data = $request->customer ?? [];

                        if ($customer) {
                            $customer->restore();
                            $customer->update([
                                'is_active' => true,
                                'customer_code' => $data['customer_code'] ?? $customer->customer_code,
                                'points' => $data['points'] ?? 0,
                                'total_purchases' => $data['total_purchases'] ?? 0,
                            ]);
                        } else {
                            Customer::create([
                                'user_id' => $existingEmail->id,
                                'is_active' => true,
                                'customer_code' => $data['customer_code'] ?? strtoupper(Str::random(6)),
                                'points' => 0,
                                'total_purchases' => 0,
                            ]);
                        }

                    } else {
                        if ($customer) $customer->update(['is_active' => false]);
                    }

                    $employee = \App\Models\Actors\Employee::withTrashed()
                        ->where('user_id', $existingEmail->id)
                        ->first();

                    if (in_array('employee', $types)) {

                        $data = $request->employee ?? [];

                        if ($employee) {
                            $employee->restore();
                            $employee->update([
                                'is_active' => true,
                                'employee_code' => $data['employee_code'] ?? $employee->employee_code,
                                'role' => $data['role'] ?? $employee->role,
                                'base_salary' => $data['base_salary'] ?? 0,
                                'commission_percentage' => $data['commission_percentage'] ?? 0,
                            ]);
                        } else {
                            \App\Models\Actors\Employee::create([
                                'user_id' => $existingEmail->id,
                                'is_active' => true,
                                'employee_code' => $data['employee_code'] ?? strtoupper(Str::random(6)),
                                'role' => $data['role'] ?? 'seller',
                                'base_salary' => 0,
                                'commission_percentage' => 0,
                                'status' => 'active'
                            ]);
                        }

                    } else {
                        if ($employee) $employee->update(['is_active' => false]);
                    }

                    DB::commit();

                    return response()->json([
                        'message' => 'Usuario sobrescrito correctamente',
                        'user' => $existingEmail->load('profile','roles','owner','customer','employee')
                    ], 200);
                }

                if ($existingEmail->trashed()) {
                    return response()->json([
                        'type' => 'restore',
                        'field' => 'email',
                        'message' => 'Este email pertenece a un usuario eliminado',
                        'user' => $existingEmail
                    ], 409);
                }

                return response()->json([
                    'field' => 'email',
                    'message' => 'Este email ya está en uso'
                ], 422);
            }

            $user = User::create([
                'email' => $request->email,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'is_active' => true
            ]);

            UserProfile::create([
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'last_name_paternal' => $request->last_name_paternal,
                'last_name_maternal' => $request->last_name_maternal,
                'phone' => $request->phone,
                'birthdate' => $request->birthdate,
                'gender' => $request->gender,
            ]);

            if ($request->filled('roles')) {
                $user->syncRoles($request->roles);
            }

            DB::commit();

            return response()->json(
                $user->load('profile','roles','owner','customer','employee'),
                201
            );

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $user = User::findOrFail($id);

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
                'types' => ['nullable','array'],
                'types.*' => ['in:owner,customer,employee'],
            ]);

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

            $types = $request->types ?? [];

            $owner = Owner::withTrashed()->where('user_id', $user->id)->first();

            if (in_array('owner', $types)) {

                if ($owner) {
                    $owner->restore();
                    $owner->update(['is_active' => true]);
                } else {
                    Owner::create([
                        'user_id' => $user->id,
                        'is_active' => true
                    ]);
                }

            } else {
                if ($owner) {
                    $owner->update(['is_active' => false]);
                }
            }

            $customer = Customer::withTrashed()->where('user_id', $user->id)->first();

            if (in_array('customer', $types)) {

                $data = $request->customer ?? [];

                if ($customer) {
                    $customer->restore();
                    $customer->update([
                        'is_active' => true,
                        'customer_code' => $data['customer_code'] ?? $customer->customer_code,
                        'points' => $customer->points,
                        'total_purchases' => $customer->total_purchases,
                    ]);
                } else {
                    Customer::create([
                        'user_id' => $user->id,
                        'is_active' => true,
                        'customer_code' => $data['customer_code'] ?? strtoupper(Str::random(6)),
                        'points' => 0,
                        'total_purchases' => 0,
                    ]);
                }

            } else {
                if ($customer) {
                    $customer->update(['is_active' => false]);
                }
            }

            $employee = \App\Models\Actors\Employee::withTrashed()
                ->where('user_id', $user->id)
                ->first();

            if (in_array('employee', $types)) {

                $data = $request->employee ?? [];

                if ($employee) {
                    $employee->restore();
                    $employee->update([
                        'is_active' => true,
                        'employee_code' => $data['employee_code'] ?? $employee->employee_code,
                        'role' => $data['role'] ?? $employee->role,
                        'base_salary' => $data['base_salary'] ?? $employee->base_salary,
                        'commission_percentage' => $data['commission_percentage'] ?? $employee->commission_percentage,
                    ]);
                } else {
                    \App\Models\Actors\Employee::create([
                        'user_id' => $user->id,
                        'is_active' => true,
                        'employee_code' => $data['employee_code'] ?? strtoupper(Str::random(6)),
                        'role' => $data['role'] ?? 'seller',
                        'base_salary' => $data['base_salary'] ?? 0,
                        'commission_percentage' => $data['commission_percentage'] ?? 0,
                        'status' => 'active'
                    ]);
                }

            } else {
                if ($employee) {
                    $employee->update(['is_active' => false]);
                }
            }



            DB::commit();

            return response()->json(
                $user->load('profile','roles','owner','customer','employee')
            );

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function restore($id)
    {
        $user = User::withTrashed()->findOrFail($id);

        $user->restore();

        return response()->json([
            'message' => 'Usuario restaurado correctamente',
            'user' => $user
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = User::with(['roles', 'owner'])->findOrFail($id);

        $authUser = $request->user();

        if (!$authUser) {
            return response()->json(['error' => 'No autenticado'], 401);
        }
        if ($authUser->id === $user->id) {
            return response()->json([
                'error' => 'No puedes eliminar tu propia cuenta'
            ], 403);
        }

        if ($user->roles->contains('name', 'Administrador')) {
            return response()->json([
                'error' => 'No puedes eliminar usuarios Administradores'
            ], 403);
        }

        if ($user->owner && $user->owner->is_active) {
            return response()->json([
                'error' => 'No puedes eliminar usuarios Owner activos'
            ], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado']);
    }

    public function deleted()
    {
        return User::onlyTrashed()
            ->with(['profile', 'roles', 'owner', 'customer', 'employee'])
            ->get();
    }

    public function forceDestroy(Request $request, $id)
    {
        $user = User::onlyTrashed()->with(['roles', 'owner'])->findOrFail($id);
        
        $authUser = $request->user();

        if (!$authUser) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        if ($user->roles->contains('name', 'Administrador')) {
            return response()->json([
                'error' => 'No puedes eliminar definitivamente usuarios Administradores'
            ], 403);
        }

        if ($user->owner && $user->owner->is_active) {
            return response()->json([
                'error' => 'No puedes eliminar definitivamente usuarios Owner activos'
            ], 403);
        }

        $user->forceDelete();

        return response()->json(['message' => 'Usuario eliminado permanentemente']);
    }

    public function reportPdf(Request $request)
    {


        $query = User::with(['profile', 'roles', 'owner', 'customer']);

        $authUser = $request->user();

        if (!$authUser) {
            abort(401, 'No autenticado');
        }

        $authUser->load(['profile', 'roles']);

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

        switch ($request->sort) {
            case "created_at_asc":
                $query->orderBy('created_at', 'asc');
                break;

            case "created_at_desc":
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $users = $query->get();

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