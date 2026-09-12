<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Actors\Customer;
use App\Models\Actors\PosCustomerProfile;
use App\Models\Core\User;
use App\Models\Core\UserProfile;
use App\Models\Auth\Role;
use App\Models\Actors\CustomerTimeline;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::with(['user.profile', 'posProfile', 'addresses']);
        $status = $request->query('status');
        if (empty($status)) {
            $status = 'active'; // Default to active if empty
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        if ($request->filled('minPoints')) {
            $query->where('points', '>=', $request->query('minPoints'));
        }

        if ($request->filled('maxPoints')) {
            $query->where('points', '<=', $request->query('maxPoints'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function($q) use ($search) {
                $q->where('customer_code', 'ILIKE', "%{$search}%")
                  ->orWhereHas('user', function ($qUser) use ($search) {
                      $qUser->where('email', 'ILIKE', "%{$search}%")
                        ->orWhereHas('profile', function ($qProf) use ($search) {
                            $qProf->where('first_name', 'ILIKE', "%{$search}%")
                               ->orWhere('last_name_paternal', 'ILIKE', "%{$search}%")
                               ->orWhere('phone', 'ILIKE', "%{$search}%");
                        });
                  })
                  ->orWhereHas('posProfile', function ($qPos) use ($search) {
                      $qPos->where('first_name', 'ILIKE', "%{$search}%")
                           ->orWhere('last_name_paternal', 'ILIKE', "%{$search}%")
                           ->orWhere('phone', 'ILIKE', "%{$search}%");
                  });
            });
        }

        // Tipo de Cliente
        if ($request->filled('type')) {
            if ($request->query('type') === 'web') {
                $query->whereNotNull('user_id');
            } elseif ($request->query('type') === 'pos') {
                $query->whereNull('user_id');
            }
        }

        // Búsqueda por Etiqueta
        if ($request->filled('tag')) {
            $tag = $request->query('tag');
            $query->whereRaw("tags::text ILIKE ?", ["%{$tag}%"]);
        }

        // Fechas
        if ($request->filled('startDate')) {
            $query->whereDate('created_at', '>=', $request->query('startDate'));
        }
        if ($request->filled('endDate')) {
            $query->whereDate('created_at', '<=', $request->query('endDate'));
        }
        
        $sortBy = $request->query('sortBy', 'created_at');
        $sortDir = strtolower($request->query('sortDir', 'desc')) === 'asc' ? 'asc' : 'desc';
        
        $allowedSorts = ['points', 'total_purchases', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return response()->json($query->get());
    }

    public function show($id)
    {
        $customer = Customer::with([
            'user.profile',
            'posProfile',
            'addresses',
            'sales.sale_details.product_variant.product',
            'sales.branch',
            'sales.user.profile',
            'sales.payments.payment_method',
            'wishlists',
            'discounts',
            'received_giftcards.transactions',
            'purchased_giftcards.transactions'
        ])->findOrFail($id);

        return response()->json($customer);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'customer_code' => 'required|string|max:20|unique:customers,customer_code',
            'email' => 'nullable|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean'
        ]);

        try {
            DB::beginTransaction();

            $isActive = $request->has('is_active') ? $request->boolean('is_active') : true;
            
            // Tomar código manual
            $customerCode = strtoupper(trim($request->customer_code));

            $emailToSave = $request->email;
            
            if (!empty($emailToSave)) {
                // Crear Usuario Web Completo
                $user = User::create([
                    'email' => $emailToSave,
                    'password' => Hash::make($request->password ?? Str::random(10)),
                    'is_active' => $isActive
                ]);

                UserProfile::create([
                    'user_id' => $user->id,
                    'first_name' => $request->first_name,
                    'last_name_paternal' => $request->last_name_paternal,
                    'last_name_maternal' => $request->last_name_maternal,
                    'phone' => $request->phone,
                ]);

                $customer = Customer::create([
                    'user_id' => $user->id,
                    'customer_code' => $customerCode,
                    'is_active' => $isActive
                ]);

                // Assign customer roles automatically
                $customerRoles = Role::where('is_customer', true)->get();
                if ($customerRoles->isNotEmpty()) {
                    $user->assignRole($customerRoles);
                }
            } else {
                // Crear Solo Cliente POS
                $customer = Customer::create([
                    'user_id' => null,
                    'customer_code' => $customerCode,
                    'is_active' => $isActive
                ]);
                
                PosCustomerProfile::create([
                    'customer_id' => $customer->id,
                    'first_name' => $request->first_name,
                    'last_name_paternal' => $request->last_name_paternal,
                    'last_name_maternal' => $request->last_name_maternal,
                    'phone' => $request->phone,
                ]);
            }

            DB::commit();

            return response()->json(Customer::with(['user.profile', 'posProfile'])->find($customer->id), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating customer', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);
        $user = $customer->user;
        $profile = $user ? $user->profile : null;

        $request->validate([
            'first_name' => 'required|string|max:100',
            'customer_code' => 'required|string|max:20|unique:customers,customer_code,' . $customer->id,
            'email' => 'nullable|email|unique:users,email,' . ($user ? $user->id : 'NULL'),
            'is_active' => 'nullable|boolean'
        ]);

        try {
            DB::beginTransaction();

            $updateData = [];
            
            if ($request->has('is_active')) {
                $customer->update([
                    'is_active' => $request->boolean('is_active'),
                    'customer_code' => strtoupper(trim($request->customer_code))
                ]);
            } else {
                $customer->update([
                    'customer_code' => strtoupper(trim($request->customer_code))
                ]);
            }

            // Flujo de Migración POS a WEB o Actualización Normal
            if (!empty($request->email)) {
                if ($user) {
                    // Update existing web user
                    $updateData['email'] = $request->email;
                    $user->update($updateData);

                    if ($request->has('password') && !empty($request->password)) {
                        $user->update(['password' => Hash::make($request->password)]);
                    }

                    if ($profile) {
                        $profile->update([
                            'first_name' => $request->first_name,
                            'last_name_paternal' => $request->last_name_paternal,
                            'last_name_maternal' => $request->last_name_maternal,
                            'phone' => $request->phone,
                        ]);
                    }
                } else {
                    // Convert POS customer to Web Customer
                    $newUser = User::create([
                        'email' => $request->email,
                        'password' => Hash::make($request->password ?? Str::random(10)),
                        'is_active' => $customer->is_active
                    ]);

                    UserProfile::create([
                        'user_id' => $newUser->id,
                        'first_name' => $request->first_name,
                        'last_name_paternal' => $request->last_name_paternal,
                        'last_name_maternal' => $request->last_name_maternal,
                        'phone' => $request->phone,
                    ]);

                    $customer->update(['user_id' => $newUser->id]);

                    // Assign roles
                    $customerRoles = Role::where('is_customer', true)->get();
                    if ($customerRoles->isNotEmpty()) {
                        $newUser->assignRole($customerRoles);
                    }

                    // Remove old pos profile
                    if ($customer->posProfile) {
                        $customer->posProfile->delete();
                    }
                }
            } else {
                // Update only POS profile
                if ($customer->posProfile) {
                    $customer->posProfile->update([
                        'first_name' => $request->first_name,
                        'last_name_paternal' => $request->last_name_paternal,
                        'last_name_maternal' => $request->last_name_maternal,
                        'phone' => $request->phone,
                    ]);
                }
            }

            DB::commit();

            return response()->json(Customer::with(['user.profile', 'posProfile'])->find($customer->id));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating customer', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->update(['is_active' => false]);
        
        if ($customer->user) {
            $customer->user->update(['is_active' => false]);
            $customer->user->delete();
        }
        
        $customer->delete();

        return response()->json(['message' => 'Customer deactivated successfully']);
    }

    public function getDeleted(Request $request)
    {
        $query = Customer::onlyTrashed()->with(['user' => function($q) {
            $q->withTrashed()->with('profile');
        }]);

        if ($request->has('search') && !empty($request->query('search'))) {
            $search = $request->query('search');
            $query->where(function($q) use ($search) {
                $q->where('customer_code', 'ILIKE', "%{$search}%")
                  ->orWhereHas('user', function ($qUser) use ($search) {
                      $qUser->withTrashed()
                            ->where('email', 'ILIKE', "%{$search}%")
                            ->orWhereHas('profile', function ($qProf) use ($search) {
                                $qProf->where('first_name', 'ILIKE', "%{$search}%")
                                      ->orWhere('last_name_paternal', 'ILIKE', "%{$search}%")
                                      ->orWhere('phone', 'ILIKE', "%{$search}%");
                            });
                  });
            });
        }

        return response()->json($query->orderBy('deleted_at', 'desc')->get());
    }

    public function restore($id)
    {
        $customer = Customer::onlyTrashed()->findOrFail($id);
        $customer->restore();
        $customer->update(['is_active' => true]);

        if ($customer->user()->withTrashed()->first()) {
            $user = $customer->user()->withTrashed()->first();
            $user->restore();
            $user->update(['is_active' => true]);
        }

        return response()->json(['message' => 'Customer restored successfully']);
    }

    public function kpis()
    {
        $totalCustomers = Customer::count();
        $activeCustomers = Customer::where('is_active', true)->count();
        $newThisMonth = Customer::whereMonth('created_at', now()->month)
                                ->whereYear('created_at', now()->year)
                                ->count();
        $totalPoints = Customer::sum('points') ?? 0;

        return response()->json([
            'totalCustomers' => $totalCustomers,
            'activeCustomers' => $activeCustomers,
            'newThisMonth' => $newThisMonth,
            'totalPoints' => $totalPoints
        ]);
    }

    public function updateTags(Request $request, $id)
    {
        $request->validate([
            'tags' => 'array'
        ]);

        $customer = Customer::findOrFail($id);
        $customer->update(['tags' => $request->tags]);

        return response()->json(['message' => 'Etiquetas actualizadas', 'customer' => $customer]);
    }

    public function adjustPoints(Request $request, $id)
    {
        $request->validate([
            'points' => 'required|integer',
            'reason' => 'required|string|max:255'
        ]);

        $customer = Customer::findOrFail($id);
        $customer->points += $request->points;
        
        // Prevent negative points
        if ($customer->points < 0) {
            $customer->points = 0;
        }
        
        $customer->save();

        CustomerTimeline::create([
            'customer_id' => $customer->id,
            'event_type' => 'points_adjustment',
            'description' => "Ajuste de puntos (" . ($request->points > 0 ? "+{$request->points}" : $request->points) . "): {$request->reason}",
            'created_by' => auth()->id()
        ]);

        return response()->json(['message' => 'Puntos ajustados', 'customer' => $customer]);
    }

    public function getTimeline($id)
    {
        $timeline = CustomerTimeline::with('creator.profile')
            ->where('customer_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($timeline);
    }

    public function searchUnlinkedUsers(Request $request)
    {
        $search = $request->query('q', '');
        
        $users = User::with('profile')
            ->whereDoesntHave('customer') // Asegura que no tienen un Customer asociado
            ->where('email', 'ILIKE', "%{$search}%")
            ->limit(15)
            ->get();
            
        return response()->json($users);
    }

    public function searchPosCustomers(Request $request)
    {
        $search = $request->query('q', '');
        
        $customers = Customer::with('posProfile')
            ->whereNull('user_id') // Solo clientes POS
            ->where(function ($q) use ($search) {
                $q->where('customer_code', 'ILIKE', "%{$search}%")
                  ->orWhereHas('posProfile', function ($qProf) use ($search) {
                      $qProf->where('first_name', 'ILIKE', "%{$search}%")
                            ->orWhere('last_name_paternal', 'ILIKE', "%{$search}%")
                            ->orWhere('last_name_maternal', 'ILIKE', "%{$search}%");
                  });
            })
            ->limit(15)
            ->get();
            
        return response()->json($customers);
    }

    public function linkUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'customer_id' => 'required|exists:customers,id',
        ]);

        try {
            DB::beginTransaction();

            $customer = Customer::findOrFail($request->customer_id);
            $user = User::findOrFail($request->user_id);

            // Validar que el usuario no tenga ya un customer
            if ($user->customer) {
                return response()->json(['message' => 'Este usuario ya está vinculado a una cuenta de cliente.'], 400);
            }

            // Validar que el customer no tenga ya un usuario
            if ($customer->user_id) {
                return response()->json(['message' => 'Esta cuenta de caja ya tiene un usuario web vinculado.'], 400);
            }

            // 1. Vincular
            $customer->update(['user_id' => $user->id]);

            // 2. Si el customer tenía posProfile, intentamos mover los datos si faltan en userProfile
            if ($customer->posProfile) {
                $userProfile = UserProfile::firstOrCreate(['user_id' => $user->id]);
                
                // Actualizar profile web con datos de posProfile si no los tiene
                $updateData = [];
                if (empty($userProfile->first_name) && !empty($customer->posProfile->first_name)) {
                    $updateData['first_name'] = $customer->posProfile->first_name;
                }
                if (empty($userProfile->last_name_paternal) && !empty($customer->posProfile->last_name_paternal)) {
                    $updateData['last_name_paternal'] = $customer->posProfile->last_name_paternal;
                }
                if (empty($userProfile->last_name_maternal) && !empty($customer->posProfile->last_name_maternal)) {
                    $updateData['last_name_maternal'] = $customer->posProfile->last_name_maternal;
                }
                if (empty($userProfile->phone) && !empty($customer->posProfile->phone)) {
                    $updateData['phone'] = $customer->posProfile->phone;
                }
                
                if (!empty($updateData)) {
                    $userProfile->update($updateData);
                }

                // 3. Eliminar (soft delete) el posProfile
                $customer->posProfile->delete();
            }

            // Assign roles
            $customerRoles = Role::where('is_customer', true)->get();
            if ($customerRoles->isNotEmpty()) {
                $user->assignRole($customerRoles);
            }

            DB::commit();

            return response()->json(['message' => 'Cuenta vinculada exitosamente.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al vincular cuenta.', 'error' => $e->getMessage()], 500);
        }
    }
}
