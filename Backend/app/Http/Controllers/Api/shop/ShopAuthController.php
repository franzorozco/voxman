<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ShopAuthController extends Controller
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
            'customer_code' => 'required|string|max:50',
            'phone' => 'required|string|max:50',
            'first_name' => 'required|string|max:100',
            'last_name_paternal' => 'required_without:last_name_maternal|nullable|string|max:100',
            'last_name_maternal' => 'required_without:last_name_paternal|nullable|string|max:100',
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
                // Update UserProfile phone if missing
                if ($user->profile) {
                    $user->profile->update([
                        'phone' => $request->phone,
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
                $customer = \App\Models\Actors\Customer::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'customer_code' => $request->customer_code,
                        'is_active' => true,
                        'tags' => $request->tags ?? []
                    ]
                );

                if (!$customer->wasRecentlyCreated && $customer->customer_code !== $request->customer_code) {
                    $customer->update([
                        'customer_code' => $request->customer_code,
                        'tags' => $request->tags ?? $customer->tags
                    ]);
                }

                // Timeline Event
                \App\Models\Actors\CustomerTimeline::create([
                    'customer_id' => $customer->id,
                    'event_type' => 'creation',
                    'description' => 'registro del perfil de cliente',
                    'performed_by' => $user->id
                ]);

                // Create Address
                \App\Models\Core\Address::create([
                    'customer_id' => $customer->id,
                    'address_type' => 'shipping',
                    'country' => $request->country,
                    'state' => $request->state,
                    'city' => $request->city,
                    'zone' => $request->zone,
                    'street' => $request->street,
                    'reference' => $request->reference,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude
                ]);
            });
            
            // Reload relations explicitly after update to ensure formatUser gets latest data
            $user->load('profile', 'customers.addresses', 'employee.branch');

            return response()->json([
                'message' => 'Perfil de cliente completado exitosamente',
                'user' => $this->formatUser($user)
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al completar perfil de cliente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function addShippingAddress(Request $request)
    {
        $request->validate([
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
        if (!$user) return response()->json(['message' => 'No autorizado'], 401);

        $customer = $user->customers()->first();
        if (!$customer) return response()->json(['message' => 'El usuario no tiene un perfil de cliente'], 400);

        \App\Models\Core\Address::create([
            'customer_id' => $customer->id,
            'address_type' => 'shipping',
            'country' => $request->country,
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
            'user' => $this->formatUser($user)
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
