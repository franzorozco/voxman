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
            'birthdate' => 'nullable|date_format:Y-m-d',
            'gender' => 'nullable|string|max:50',
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

        if (empty($customerIds)) {
            return response()->json(['message' => 'No tienes un perfil de cliente.'], 403);
        }

        $address = \App\Models\Core\Address::where('id', $id)
            ->whereIn('customer_id', $customerIds)
            ->firstOrFail();

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

        if (empty($customerIds)) {
            return response()->json(['message' => 'No tienes un perfil de cliente.'], 403);
        }

        $address = \App\Models\Core\Address::where('id', $id)
            ->whereIn('customer_id', $customerIds)
            ->firstOrFail();

        $address->delete();

        $user->load('profile', 'customers.addresses', 'employee.branch');

        return response()->json([
            'message' => 'Dirección eliminada exitosamente',
            'user' => $this->formatUser($user)
        ]);
    }

    public function myOrders(Request $request)
    {
        $customer = $request->user()->customer;

        if (!$customer) {
            return response()->json([]);
        }

        $query = \App\Models\Sales\Sale::with([
            'sale_details.product_variant.product',
            'sale_details.product_variant.size',
            'sale_details.product_variant.fit',
            'sale_details.sale_applied_discount',
            'shipments.delivery_schedule',
            'shipments.address',
            'payments',
            'sale_applied_discounts'
        ])->where('customer_id', $customer->id)
          ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $status = $request->query('status');
            $query->whereHas('shipments.delivery_schedule', function($q) use ($status) {
                if ($status === 'pending') {
                    $q->whereIn('status', ['pending', 'assigned', 'requested', 'reserved', 'preparing', 'prepared']);
                } elseif ($status === 'in_transit') {
                    $q->whereIn('status', ['on_the_way', 'at_the_meeting_point', 'ready_for_pickup', 'packaged', 'shipped']);
                } elseif ($status === 'completed') {
                    $q->where('status', 'completed');
                } elseif ($status === 'cancelled') {
                    $q->where('status', 'cancelled');
                }
            });
        }

        $sales = $query->get();

        $formattedSales = $sales->map(function($sale) {
            return [
                'id' => $sale->id,
                'invoice_number' => $sale->invoice_number,
                'created_at' => $sale->created_at,
                'status' => $sale->status,
                'source' => $sale->source,
                'dynamic_total' => $sale->dynamic_total,
                'dynamic_subtotal' => $sale->dynamic_subtotal,
                'dynamic_global_discount' => $sale->dynamic_global_discount,
                'items_count' => $sale->sale_details->count(),
                'items' => $sale->sale_details->map(function($detail) {
                    return [
                        'product_name' => optional(optional($detail->product_variant)->product)->name,
                        'size' => optional(optional($detail->product_variant)->size)->name,
                        'fit' => optional(optional($detail->product_variant)->fit)->name,
                        'sku' => optional($detail->product_variant)->sku,
                        'quantity' => $detail->quantity,
                        'unit_price' => $detail->dynamic_unit_price,
                        'final_price' => $detail->dynamic_subtotal,
                    ];
                }),
                'shipments' => $sale->shipments->map(function($shipment) {
                    return [
                        'id' => $shipment->id,
                        'status' => $shipment->status,
                        'delivery_type' => $shipment->delivery_type,
                        'tracking_code' => $shipment->tracking_code,
                        'shipped_at' => $shipment->shipped_at,
                        'delivered_at' => $shipment->delivered_at,
                        'shipping_cost' => $shipment->shipping_cost,
                        'shipping_payment_type' => $shipment->shipping_payment_type,
                        'agency_dispatch_cost' => $shipment->agency_dispatch_cost,
                        'delivery_schedule' => $shipment->delivery_schedule ? [
                            'id' => $shipment->delivery_schedule->id,
                            'status' => $shipment->delivery_schedule->status,
                            'scheduled_date' => $shipment->delivery_schedule->scheduled_date,
                        ] : null,
                    ];
                }),
                'payments' => $sale->payments->map(function($payment) {
                    return [
                        'amount' => $payment->amount,
                        'method' => $payment->method,
                        'created_at' => $payment->created_at,
                    ];
                }),
            ];
        });

        return response()->json($formattedSales);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
