<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ShopProfileController extends Controller
{
    private function formatUser($user)
    {
        $user->loadMissing('profile', 'customers.addresses', 'employee.branch');
        
        return [
            'id' => $user->id,
            'email' => $user->email,
            'username' => $user->username,
            'full_name' => optional($user->profile)->first_name . ' ' . optional($user->profile)->last_name_paternal,
            'photo' => optional($user->profile)->photo ?? null,
            'employee' => $user->employee ? [
                'id' => $user->employee->id,
                'branch_id' => $user->employee->branch_id,
                'branch' => $user->employee->branch ? [
                    'id' => $user->employee->branch->id,
                    'name' => $user->employee->branch->name
                ] : null,
            ] : null,
            'roles' => $user->getRoleNames(), 
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'profile' => $user->profile,
            'customers' => $user->customers,
        ];
    }



    public function profile(Request $request)
    {
        return response()->json([
            'user' => $this->formatUser($request->user())
        ]);
    }

    public function updateCustomerProfile(Request $request)
    {
        $request->validate([
            'customer_code' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:50',
            'first_name' => 'required|string|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'birthdate' => 'nullable|date',
            'gender' => 'nullable|string|in:Masculino,Femenino,Prefiero no decirlo',
            'country' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'zone' => 'nullable|string|max:150',
            'street' => 'nullable|string|max:150',
            'reference' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric'
        ]);

        $user = $request->user();

        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($request, $user) {
                // Update UserProfile
                if ($user->profile) {
                    $user->profile->update([
                        'phone' => $request->phone ?? $user->profile->phone,
                        'first_name' => $request->first_name,
                        'last_name_paternal' => $request->last_name_paternal,
                        'last_name_maternal' => $request->last_name_maternal,
                        'birthdate' => $request->birthdate,
                        'gender' => $request->gender
                    ]);
                } else {
                    \App\Models\Core\UserProfile::create([
                        'user_id' => $user->id,
                        'first_name' => $request->first_name,
                        'last_name_paternal' => $request->last_name_paternal,
                        'last_name_maternal' => $request->last_name_maternal,
                        'birthdate' => $request->birthdate,
                        'gender' => $request->gender,
                        'phone' => $request->phone
                    ]);
                }

                // Create or Update Customer
                $existingCustomer = $user->customers()->first();
                $code = $request->customer_code 
                    ?: ($existingCustomer ? $existingCustomer->customer_code : 'CLI-' . strtoupper(substr(uniqid(), -6)));

                $customer = \App\Models\Actors\Customer::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'customer_code' => $code,
                        'is_active' => true,
                        'tags' => $request->tags ?? []
                    ]
                );

                if (!$customer->wasRecentlyCreated && $request->filled('customer_code') && $customer->customer_code !== $request->customer_code) {
                    $customer->update([
                        'customer_code' => $request->customer_code,
                        'tags' => $request->tags ?? $customer->tags
                    ]);
                }

                // Create Address ONLY if street or zone is supplied
                if ($request->filled('street') || $request->filled('zone')) {
                    \App\Models\Core\Address::create([
                        'user_id' => $user->id,
                        'customer_id' => $customer->id,
                        'address_type' => 'shipping',
                        'country' => $request->country ?? 'Bolivia',
                        'state' => $request->state,
                        'city' => $request->city,
                        'zone' => $request->zone,
                        'street' => $request->street,
                        'reference' => $request->reference,
                        'latitude' => $request->latitude,
                        'longitude' => $request->longitude
                    ]);
                }
            });
            
            $user->load('profile', 'customers.addresses', 'employee.branch');

            return response()->json([
                'message' => 'Perfil actualizado exitosamente',
                'user' => $this->formatUser($user)
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al actualizar perfil de cliente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ], [
            'current_password.required' => 'La contraseña actual es requerida.',
            'new_password.required' => 'La nueva contraseña es requerida.',
            'new_password.min' => 'La nueva contraseña debe tener al menos 8 caracteres.',
            'new_password.confirmed' => 'La confirmación de la nueva contraseña no coincide.',
        ]);

        $user = $request->user();

        if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'La contraseña actual no coincide.'], 422);
        }

        $user->update(['password' => \Illuminate\Support\Facades\Hash::make($request->new_password)]);

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

    public function addShippingAddress(Request $request)
    {
        $request->validate([
            'country' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'zone' => 'nullable|string|max:150',
            'street' => 'required|string|max:150',
            'reference' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric'
        ]);

        $user = $request->user();
        if (!$user) return response()->json(['message' => 'No autorizado'], 401);

        $customer = $user->customers()->first();
        if (!$customer) {
            $customer = \App\Models\Actors\Customer::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'customer_code' => 'CLI-' . strtoupper(substr(uniqid(), -6)),
                    'is_active' => true
                ]
            );
        }

        $address = \App\Models\Core\Address::create([
            'user_id' => $user->id,
            'customer_id' => $customer->id,
            'address_type' => 'shipping',
            'country' => $request->country ?? 'Bolivia',
            'state' => $request->state,
            'city' => $request->city,
            'zone' => $request->zone,
            'street' => $request->street,
            'reference' => $request->reference,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude
        ]);

        $user->load('profile', 'customers.addresses', 'employee.branch');

        return response()->json([
            'message' => 'Dirección guardada exitosamente',
            'address' => $address,
            'user' => $this->formatUser($user)
        ]);
    }

    public function updateAddress(Request $request, $id)
    {
        $user = $request->user();
        $customerIds = $user->customers()->pluck('id')->toArray();

        $address = \App\Models\Core\Address::where('id', $id)
            ->where(function($query) use ($user, $customerIds) {
                $query->where('user_id', $user->id)
                      ->orWhereIn('customer_id', $customerIds);
            })->firstOrFail();

        $request->validate([
            'country' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'zone' => 'nullable|string|max:150',
            'street' => 'required|string|max:150',
            'reference' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric'
        ]);

        $address->update($request->only([
            'country', 'state', 'city', 'zone', 'street', 'reference', 'latitude', 'longitude'
        ]));

        $user->load('profile', 'customers.addresses', 'employee.branch');

        return response()->json([
            'message' => 'Dirección actualizada exitosamente',
            'address' => $address,
            'user' => $this->formatUser($user)
        ]);
    }

    public function deleteAddress(Request $request, $id)
    {
        $user = $request->user();
        $customerIds = $user->customers()->pluck('id')->toArray();

        $address = \App\Models\Core\Address::where('id', $id)
            ->where(function($query) use ($user, $customerIds) {
                $query->where('user_id', $user->id)
                      ->orWhereIn('customer_id', $customerIds);
            })->firstOrFail();

        $address->delete();

        $user->load('profile', 'customers.addresses', 'employee.branch');

        return response()->json([
            'message' => 'Dirección eliminada exitosamente',
            'user' => $this->formatUser($user)
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
