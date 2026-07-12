<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Actors\Customer;
use App\Models\Actors\PosCustomerProfile;
use App\Models\Core\User;
use App\Models\Core\UserProfile;
use App\Models\Auth\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::with(['user.profile', 'posProfile']);
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
        $profile = $user->profile;

        $request->validate([
            'first_name' => 'required|string|max:100',
            'customer_code' => 'required|string|max:20|unique:customers,customer_code,' . $customer->id,
            'email' => 'nullable|email|unique:users,email,' . $user->id,
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
}
