<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ShopProfileController extends Controller
{
    private function formatUser($user)
    {
        $user->loadMissing('profile', 'customers.addresses', 'employee.branch', 'owner');
        
        return [
            'id' => $user->id,
            'email' => $user->email,
            'username' => $user->username,
            'email_verified_at' => $user->email_verified_at,
            'is_email_verified' => $user->email_verified_at !== null || !empty($user->google_id),
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
            'owner' => $user->owner,
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
            'last_name_paternal' => 'required|string|max:100',
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
            'longitude' => 'nullable|numeric',
            'notification_email' => 'nullable|email|max:255'
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
                        'last_name_maternal' => $request->has('last_name_maternal') ? $request->last_name_maternal : $user->profile->last_name_maternal,
                        'birthdate' => $request->has('birthdate') ? $request->birthdate : $user->profile->birthdate,
                        'gender' => $request->has('gender') ? $request->gender : $user->profile->gender
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

                // Si el usuario tiene perfil de Owner, actualizar su correo de notificaciones
                if ($user->owner && $request->has('notification_email')) {
                    $user->owner->update([
                        'notification_email' => $request->notification_email
                    ]);
                }

                // Create or Update Customer
                $existingCustomer = $user->customers()->first();
                
                if ($existingCustomer && $request->filled('customer_code') && $existingCustomer->customer_code !== $request->customer_code) {
                    if ($existingCustomer->customer_code_updated_at && \Carbon\Carbon::parse($existingCustomer->customer_code_updated_at)->addMonths(2)->isFuture()) {
                        throw new \Exception('No puedes cambiar tu número de carnet todavía. Deben pasar 2 meses desde el último cambio.');
                    }
                }

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
                        'customer_code_updated_at' => now(),
                        'tags' => $request->tags ?? $customer->tags
                    ]);
                }

                // Create Address ONLY if street or zone is supplied
                if ($request->filled('street') || $request->filled('zone')) {
                    \App\Models\Core\Address::create([
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
            // Mínimo 8 chars, al menos 1 mayúscula, 1 minúscula, 1 número, 1 símbolo
            'new_password'     => [
                'required',
                'string',
                'min:8',
                'confirmed',
                \Illuminate\Validation\Rules\Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ], [
            'current_password.required' => 'La contraseña actual es requerida.',
            'new_password.required'     => 'La nueva contraseña es requerida.',
            'new_password.min'          => 'La nueva contraseña debe tener al menos 8 caracteres.',
            'new_password.confirmed'    => 'La confirmación de la nueva contraseña no coincide.',
        ]);

        $user = $request->user();

        if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'La contraseña actual no coincide.'], 422);
        }

        $user->update(['password' => \Illuminate\Support\Facades\Hash::make($request->new_password)]);

        // 🔒 Revocar TODOS los tokens activos al cambiar contraseña
        // Esto fuerza logout de todas las sesiones abiertas por seguridad
        $user->tokens()->delete();

        return response()->json(['message' => 'Contraseña actualizada correctamente. Por favor inicia sesión de nuevo.']);
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

        // 🔒 El customer_id siempre viene del usuario autenticado — nunca del request
        $query = \App\Models\Sales\Sale::with([
            'sale_details.product_variant.product.product_images',
            'sale_details.product_variant.product.attribute_value_images',
            'sale_details.product_variant.variant_images',
            'sale_details.product_variant.variant_attribute_values.attribute_value',
            'sale_details.product_variant.size',
            'sale_details.product_variant.fit',
            'sale_details.sale_applied_discount',
            'sale_details.return_request',
            'shipments.delivery_schedule',
            'shipments.address',
            'payments',
            'sale_applied_discounts'
        ])->where('customer_id', $customer->id) // 🔒 IDOR: solo pedidos propios
          ->orderBy('created_at', 'desc');

        // 🔒 Whitelist de valores permitidos para el filtro de status
        $allowedStatuses = ['pending', 'in_transit', 'completed', 'cancelled'];
        if ($request->has('status') && in_array($request->query('status'), $allowedStatuses, true)) {
            $status = $request->query('status');
            $query->whereHas('shipments.delivery_schedule', function ($q) use ($status) {
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
        $formattedSales = \App\Http\Resources\SaleResource::collection($sales);

        return response()->json($formattedSales);
    }

    /**
     * Obtener carritos del cliente autenticado (IDOR protegido)
     */
    public function myCarts(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        // 🔒 Extraer únicamente IDs de cliente vinculados al usuario autenticado
        $customerIds = $user->customers()->pluck('id')->toArray();

        if (empty($customerIds)) {
            return response()->json([]);
        }

        // Expirar automáticamente carritos vencidos
        \App\Models\Sales\Cart::whereIn('customer_id', $customerIds)
            ->where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => 'abandoned']);

        $query = \App\Models\Sales\Cart::with([
            'discount',
            'items.appliedDiscount',
            'items.product_variant.inventories',
            'items.product_variant.product.category',
            'items.product_variant.product.brand',
            'items.product_variant.product.product_images',
            'items.product_variant.product.attribute_value_images',
            'items.product_variant.variant_images',
            'items.product_variant.variant_attribute_values.attribute_value.attribute',
            'items.product_variant.size',
            'items.product_variant.fit',
        ])
        ->whereIn('customer_id', $customerIds)
        ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $allowedStatuses = ['active', 'proforma', 'converted', 'ordered', 'abandoned'];
            if (in_array($request->status, $allowedStatuses, true)) {
                $query->where('status', $request->status);
            }
        }

        $carts = $query->get();
        $discountService = app(\App\Services\Finance\DiscountValidationService::class);

        $carts->transform(function ($cart) use ($discountService) {
            $discountService->calculateAndValidateCart($cart);

            $isOrderedOrInactive = in_array($cart->status, ['ordered', 'converted', 'completed', 'cancelled', 'disabled', 'inactive'], true);

            if ($isOrderedOrInactive) {
                $cart->has_stock_issues = false;
                $cart->can_remind = false;
                $cart->is_actionable = false;
                $cart->next_reminder_at = null;
                $cart->last_reminder_sent_at = $cart->delivery_details['last_reminder_sent_at'] ?? null;
                return $cart;
            }

            $lastReminder = $cart->delivery_details['last_reminder_sent_at'] ?? null;
            $canRemind = true;
            $nextReminderAt = null;
            if ($lastReminder) {
                $lastTime = \Carbon\Carbon::parse($lastReminder);
                if ($lastTime->diffInHours(now()) < 24) {
                    $canRemind = false;
                    $nextReminderAt = $lastTime->copy()->addHours(24)->toISOString();
                }
            }
            $cart->can_remind = $canRemind;
            $cart->is_actionable = true;
            $cart->next_reminder_at = $nextReminderAt;
            $cart->last_reminder_sent_at = $lastReminder;

            return $cart;
        });

        return response()->json($carts);
    }

    /**
     * Enviar recordatorio/reactivación a los owners de los productos del carrito (1 vez cada 24 horas)
     */
    public function remindCartOwners(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $customerIds = $user->customers()->pluck('id')->toArray();

        $cart = \App\Models\Sales\Cart::where('id', $id)
            ->whereIn('customer_id', $customerIds)
            ->first();

        if (!$cart) {
            return response()->json(['message' => 'Carrito no encontrado'], 404);
        }

        if (in_array($cart->status, ['ordered', 'converted', 'completed', 'cancelled', 'disabled', 'inactive'], true)) {
            return response()->json([
                'message' => 'Este carrito ya fue convertido a entrega o desactivado y no admite recordatorios ni reactivación.',
                'can_remind' => false,
            ], 422);
        }

        $deliveryDetails = $cart->delivery_details ?? [];
        $lastReminder = $deliveryDetails['last_reminder_sent_at'] ?? null;

        if ($lastReminder) {
            $lastTime = \Carbon\Carbon::parse($lastReminder);
            $hoursPassed = $lastTime->diffInHours(now());
            if ($hoursPassed < 24) {
                $remainingHours = 24 - $hoursPassed;
                return response()->json([
                    'message' => "Ya enviaste un recordatorio hoy. Podrás enviar otro en aproximadamente {$remainingHours} horas.",
                    'can_remind' => false,
                    'next_reminder_at' => $lastTime->copy()->addHours(24)->toISOString(),
                    'last_reminder_sent_at' => $lastReminder,
                ], 429);
            }
        }

        // Marcar envío de recordatorio en delivery_details
        $deliveryDetails['last_reminder_sent_at'] = now()->toISOString();
        $cart->delivery_details = $deliveryDetails;
        $cart->save();

        // Despachar Job asíncrono
        \App\Jobs\SendCartReminderOwnerEmails::dispatch($cart->id);

        $isExpired = ($cart->status === 'abandoned') || ($cart->expires_at && $cart->expires_at->isPast());
        $successMessage = $isExpired 
            ? 'Petición de reactivación enviada con éxito a los encargados de los productos.' 
            : 'Recordatorio para agendar entrega enviado con éxito a los encargados.';

        return response()->json([
            'message' => $successMessage,
            'can_remind' => false,
            'last_reminder_sent_at' => $deliveryDetails['last_reminder_sent_at'],
            'next_reminder_at' => now()->addHours(24)->toISOString()
        ]);
    }

    /**
     * Eliminar un carrito propio
     */
    public function deleteMyCart(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $customerIds = $user->customers()->pluck('id')->toArray();

        $cart = \App\Models\Sales\Cart::where('id', $id)
            ->whereIn('customer_id', $customerIds)
            ->first();

        if (!$cart) {
            return response()->json(['message' => 'Carrito no encontrado'], 404);
        }

        $cart->items()->delete();
        $cart->delete();

        return response()->json(['message' => 'Carrito eliminado exitosamente']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
