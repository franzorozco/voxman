<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Actors\Customer;
use App\Models\Actors\PosCustomerProfile;
use App\Models\Core\User;
use App\Models\Core\UserProfile;
use App\Models\Auth\Role;
use App\Models\Actors\CustomerTimeline;
use App\Mail\WelcomeCustomer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
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
            'sales.sale_details.product_variant.size',
            'sales.sale_details.product_variant.fit',
            'sales.branch',
            'sales.user.profile',
            'sales.payments.payment_method',
            'sales.shipments',
            'sales.sale_applied_discounts',
            'wishlists',
            'discounts',
            'received_giftcards.transactions',
            'purchased_giftcards.transactions'
        ])->findOrFail($id);

        $customerArray = $customer->toArray();
        $customerArray['sales'] = \App\Http\Resources\SaleResource::collection($customer->sales);

        return response()->json($customerArray);
    }

    /**
     * Extrae el username desde el correo sin el dominio (@gmail.com, @hotmail.com, etc.)
     */
    private function extractUsernameFromEmail(string $email, ?string $ignoreUserId = null): string
    {
        $localPart = trim(Str::before(trim($email), '@'));
        if ($localPart === '') {
            $localPart = 'user_' . Str::lower(Str::random(6));
        }
        $baseUsername = Str::limit($localPart, 50, '');

        // Si existe un usuario eliminado hace >= 60 días con ese mismo username, liberar su username
        $oldTrashedUsers = User::onlyTrashed()
            ->whereRaw('LOWER(username) = ?', [Str::lower($baseUsername)])
            ->when($ignoreUserId, fn($q) => $q->where('id', '!=', $ignoreUserId))
            ->get();

        foreach ($oldTrashedUsers as $trashedUser) {
            if ($trashedUser->deleted_at && \Carbon\Carbon::parse($trashedUser->deleted_at)->diffInDays(now()) >= 60) {
                DB::table('users')
                    ->where('id', $trashedUser->id)
                    ->update(['username' => 'del_' . Str::lower(Str::random(6)) . '_' . Str::limit($baseUsername, 30, '')]);
            }
        }

        // Verificar si otro usuario distinto ya usa este username
        $username = $baseUsername;
        $counter = 1;
        while (
            User::withTrashed()
                ->whereRaw('LOWER(username) = ?', [Str::lower($username)])
                ->when($ignoreUserId, fn($q) => $q->where('id', '!=', $ignoreUserId))
                ->exists()
        ) {
            $suffix = '_' . $counter;
            $username = Str::limit($baseUsername, 50 - strlen($suffix), '') . $suffix;
            $counter++;
        }

        return $username;
    }

    /**
     * Normaliza el teléfono: si solo viene el código de país (ej. "+591") sin número, devuelve null.
     */
    private function normalizePhone(?string $rawPhone): ?string
    {
        if ($rawPhone === null) {
            return null;
        }
        $trimmed = trim($rawPhone);
        if ($trimmed === '' || preg_match('/^\+\d{1,4}$/', $trimmed)) {
            return null;
        }
        return $trimmed;
    }

    /**
     * Valida en tiempo real si un correo puede usarse para cuenta web.
     * - Si existe y está activo: no permitido.
     * - Si existe, está eliminado y lleva < 60 días: no permitido.
     * - Si existe, está eliminado y lleva >= 60 días: permitido (se puede volver a crear).
     */
    public function checkEmail(Request $request)
    {
        $rawEmail = trim((string) $request->query('email', ''));
        $customerId = $request->query('customer_id');

        if ($rawEmail === '' || !filter_var($rawEmail, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'valid_format' => false,
                'available' => false,
                'status' => 'invalid_format',
                'username_preview' => $rawEmail !== '' ? Str::before($rawEmail, '@') : '',
                'message' => 'Ingresa un correo electrónico con formato válido (ej. usuario@dominio.com).'
            ]);
        }

        $email = Str::lower($rawEmail);
        $usernamePreview = Str::before($email, '@');

        $existingUser = User::withTrashed()
            ->with([
                'profile' => fn($q) => $q->withTrashed(),
                'customer' => fn($q) => $q->withTrashed()
            ])
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        if (!$existingUser) {
            return response()->json([
                'valid_format' => true,
                'available' => true,
                'status' => 'available',
                'username_preview' => $usernamePreview,
                'message' => "Correo disponible. Se registrará el usuario \"{$usernamePreview}\" (sin dominio)."
            ]);
        }

        // Si estamos editando al mismo cliente propietario de este correo
        if ($customerId && $existingUser->customer && (string) $existingUser->customer->id === (string) $customerId) {
            return response()->json([
                'valid_format' => true,
                'available' => true,
                'status' => 'own_email',
                'username_preview' => $usernamePreview,
                'message' => 'Este es el correo actual vinculado al cliente.'
            ]);
        }

        $deletedAt = $existingUser->deleted_at ?? $existingUser->customer?->deleted_at;

        if ($deletedAt === null) {
            if ($existingUser->email_verified_at === null && $existingUser->google_id === null) {
                return response()->json([
                    'valid_format' => true,
                    'available' => true,
                    'status' => 'deleted_over_60',
                    'username_preview' => $usernamePreview,
                    'message' => "Aviso: Este correo tenía un registro pendiente sin verificar. Al guardar se activará y vinculará al cliente con el usuario \"{$usernamePreview}\"."
                ]);
            }

            return response()->json([
                'valid_format' => true,
                'available' => false,
                'status' => 'active_exists',
                'username_preview' => $usernamePreview,
                'message' => 'Advertencia: Este correo electrónico ya existe y pertenece a una cuenta activa. No podemos sobrescribir una cuenta activa.'
            ]);
        }

        $deletedDate = \Carbon\Carbon::parse($deletedAt);
        $daysDeleted = (int) floor($deletedDate->diffInDays(now()));

        if ($daysDeleted < 60) {
            $daysRemaining = max(1, 60 - $daysDeleted);
            return response()->json([
                'valid_format' => true,
                'available' => false,
                'status' => 'deleted_under_60',
                'days_deleted' => $daysDeleted,
                'days_remaining' => $daysRemaining,
                'deleted_at' => $deletedDate->toIso8601String(),
                'username_preview' => $usernamePreview,
                'message' => "Advertencia: Este correo pertenece a una cuenta eliminada hace {$daysDeleted} día(s). No se puede volver a crear hasta que pasen 60 días desde su eliminación (faltan {$daysRemaining} día(s)), o puedes restaurarla desde la Papelera."
            ]);
        }

        return response()->json([
            'valid_format' => true,
            'available' => true,
            'status' => 'deleted_over_60',
            'days_deleted' => $daysDeleted,
            'deleted_at' => $deletedDate->toIso8601String(),
            'username_preview' => $usernamePreview,
            'message' => "Aviso: Este correo pertenecía a una cuenta eliminada hace {$daysDeleted} días (más de 60 días). Está permitido crear la nueva cuenta con este correo."
        ]);
    }

    public function store(Request $request)
    {
        User::ensureEmailVerificationSchema();

        $request->validate([
            'first_name' => 'required|string|min:2|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'customer_code' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'phone' => 'nullable|string|max:30',
            'is_active' => 'nullable|boolean'
        ], [
            'first_name.required' => 'El campo Nombres es obligatorio.',
            'first_name.min' => 'El nombre debe tener al menos 2 caracteres.',
            'email.email' => 'El formato del correo electrónico no es válido.',
        ]);

        try {
            DB::beginTransaction();

            $isActive = $request->has('is_active') ? $request->boolean('is_active') : true;
            $firstName = trim((string) $request->first_name);
            $lastNamePaternal = $request->filled('last_name_paternal') ? trim((string) $request->last_name_paternal) : null;
            $lastNameMaternal = $request->filled('last_name_maternal') ? trim((string) $request->last_name_maternal) : null;
            $phone = $this->normalizePhone($request->phone);

            // Código de cliente (manual o autogenerado si viene vacío)
            $customerCode = $request->filled('customer_code')
                ? strtoupper(trim((string) $request->customer_code))
                : '';

            if ($customerCode === '') {
                do {
                    $customerCode = (string) rand(1000000000, 9999999999);
                } while (Customer::withTrashed()->where('customer_code', $customerCode)->exists());
            }

            $emailToSave = $request->filled('email') ? Str::lower(trim((string) $request->email)) : null;

            if (!empty($emailToSave)) {
                // Validar existencia de correo (activo vs eliminado < 60 días vs eliminado >= 60 días)
                $existingUser = User::withTrashed()
                    ->with([
                        'profile' => fn($q) => $q->withTrashed(),
                        'customer' => fn($q) => $q->withTrashed()
                    ])
                    ->whereRaw('LOWER(email) = ?', [$emailToSave])
                    ->first();

                $reusingDeletedUser = false;

                if ($existingUser) {
                    $deletedAt = $existingUser->deleted_at ?? $existingUser->customer?->deleted_at;

                    if ($deletedAt === null) {
                        if ($existingUser->email_verified_at === null && $existingUser->google_id === null) {
                            $reusingDeletedUser = true;
                        } else {
                            DB::rollBack();
                            return response()->json([
                                'field' => 'email',
                                'code' => 'EMAIL_ACTIVE_EXISTS',
                                'message' => "Advertencia: El correo '{$emailToSave}' ya está registrado y activo. No podemos sobrescribir una cuenta activa."
                            ], 422);
                        }
                    } else {
                        $daysDeleted = (int) floor(\Carbon\Carbon::parse($deletedAt)->diffInDays(now()));
                        if ($daysDeleted < 60) {
                            $daysRemaining = max(1, 60 - $daysDeleted);
                            DB::rollBack();
                            return response()->json([
                                'field' => 'email',
                                'code' => 'EMAIL_DELETED_UNDER_60_DAYS',
                                'days_deleted' => $daysDeleted,
                                'days_remaining' => $daysRemaining,
                                'message' => "Advertencia: El correo '{$emailToSave}' pertenece a una cuenta eliminada hace {$daysDeleted} día(s). Solo se puede volver a crear si han pasado más de 60 días (faltan {$daysRemaining} día(s))."
                            ], 422);
                        }

                        $reusingDeletedUser = true;
                    }
                }

                // Validar unicidad de customer_code (ignorando el customer del usuario eliminado >= 60 días si aplica)
                $ignoreCustomerId = ($reusingDeletedUser && $existingUser?->customer) ? $existingUser->customer->id : null;
                $codeConflict = Customer::withTrashed()
                    ->where('customer_code', $customerCode)
                    ->when($ignoreCustomerId, fn($q) => $q->where('id', '!=', $ignoreCustomerId))
                    ->exists();

                if ($codeConflict) {
                    DB::rollBack();
                    return response()->json([
                        'field' => 'customer_code',
                        'message' => "El código de cliente '{$customerCode}' ya está registrado."
                    ], 422);
                }

                // Username igual a lo registrado en el correo sin @gmail.com / @hotmail.com ni ningún dominio
                $username = $this->extractUsernameFromEmail($emailToSave, $existingUser?->id);

                // Generar contraseña temporal segura
                $temporaryPassword = Str::upper(Str::random(3)) . rand(100, 999) . Str::random(3);

                if ($reusingDeletedUser && $existingUser) {
                    if ($existingUser->trashed()) {
                        $existingUser->restore();
                    }

                    $existingUser->update([
                        'email' => $emailToSave,
                        'username' => $username,
                        'password' => Hash::make($temporaryPassword),
                        'is_active' => $isActive,
                        'email_verified_at' => now(),
                        'google_id' => null,
                        'avatar' => null,
                    ]);

                    $user = $existingUser;

                    $existingProfile = UserProfile::withTrashed()->where('user_id', $user->id)->first();
                    if ($existingProfile) {
                        if ($existingProfile->trashed()) {
                            $existingProfile->restore();
                        }
                        $existingProfile->update([
                            'first_name' => $firstName,
                            'last_name_paternal' => $lastNamePaternal,
                            'last_name_maternal' => $lastNameMaternal,
                            'phone' => $phone,
                        ]);
                    } else {
                        UserProfile::create([
                            'user_id' => $user->id,
                            'first_name' => $firstName,
                            'last_name_paternal' => $lastNamePaternal,
                            'last_name_maternal' => $lastNameMaternal,
                            'phone' => $phone,
                        ]);
                    }

                    $existingCustomer = Customer::withTrashed()->where('user_id', $user->id)->first();
                    if ($existingCustomer) {
                        if ($existingCustomer->trashed()) {
                            $existingCustomer->restore();
                        }
                        $existingCustomer->update([
                            'customer_code' => $customerCode,
                            'is_active' => $isActive,
                            'points' => 0,
                            'total_purchases' => 0,
                            'tags' => [],
                        ]);
                        $customer = $existingCustomer;
                    } else {
                        $customer = Customer::create([
                            'user_id' => $user->id,
                            'customer_code' => $customerCode,
                            'is_active' => $isActive,
                            'points' => 0,
                            'total_purchases' => 0,
                        ]);
                    }

                    if ($customer->posProfile) {
                        $customer->posProfile->delete();
                    }
                } else {
                    // Crear Usuario Web Completo con username sin @dominio
                    $user = User::create([
                        'email' => $emailToSave,
                        'username' => $username,
                        'password' => Hash::make($temporaryPassword),
                        'is_active' => $isActive,
                        'email_verified_at' => now(),
                    ]);

                    // Registrar Nombres, Apellido Paterno, Apellido Materno y Teléfono en user_profiles
                    UserProfile::create([
                        'user_id' => $user->id,
                        'first_name' => $firstName,
                        'last_name_paternal' => $lastNamePaternal,
                        'last_name_maternal' => $lastNameMaternal,
                        'phone' => $phone,
                    ]);

                    $customer = Customer::create([
                        'user_id' => $user->id,
                        'customer_code' => $customerCode,
                        'is_active' => $isActive
                    ]);
                }

                // Assign customer roles automatically
                $customerRoles = Role::where('is_customer', true)->get();
                if ($customerRoles->isNotEmpty()) {
                    $user->syncRoles($customerRoles);
                }

                // Enviar correo de bienvenida con contraseña temporal
                try {
                    $loginUrl = rtrim(env('FRONTEND_URL', env('APP_URL', '')), '/') . '/login';
                    Mail::to($emailToSave)->send(new WelcomeCustomer(
                        $firstName,
                        $emailToSave,
                        $temporaryPassword,
                        $loginUrl
                    ));
                } catch (\Exception $mailException) {
                    Log::warning('WelcomeCustomer email failed: ' . $mailException->getMessage());
                }
            } else {
                // Validar unicidad de customer_code para Cliente POS
                if (Customer::withTrashed()->where('customer_code', $customerCode)->exists()) {
                    DB::rollBack();
                    return response()->json([
                        'field' => 'customer_code',
                        'message' => "El código de cliente '{$customerCode}' ya está registrado."
                    ], 422);
                }

                // Crear Solo Cliente POS (cuando "Habilitar cuenta web" no está activo)
                $customer = Customer::create([
                    'user_id' => null,
                    'customer_code' => $customerCode,
                    'is_active' => $isActive
                ]);
                
                PosCustomerProfile::create([
                    'customer_id' => $customer->id,
                    'first_name' => $firstName,
                    'last_name_paternal' => $lastNamePaternal,
                    'last_name_maternal' => $lastNameMaternal,
                    'phone' => $phone,
                ]);
            }

            DB::commit();

            return response()->json(Customer::with(['user.profile', 'posProfile'])->find($customer->id), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al crear el cliente: ' . $e->getMessage(), 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);
        $user = $customer->user;

        $request->validate([
            'first_name' => 'required|string|min:2|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'customer_code' => 'required|string|max:20|unique:customers,customer_code,' . $customer->id,
            'email' => 'nullable|email|max:150',
            'phone' => 'nullable|string|max:30',
            'is_active' => 'nullable|boolean'
        ]);

        try {
            DB::beginTransaction();

            $firstName = trim((string) $request->first_name);
            $lastNamePaternal = $request->filled('last_name_paternal') ? trim((string) $request->last_name_paternal) : null;
            $lastNameMaternal = $request->filled('last_name_maternal') ? trim((string) $request->last_name_maternal) : null;
            $phone = $this->normalizePhone($request->phone);
            $emailToSave = $request->filled('email') ? Str::lower(trim((string) $request->email)) : null;

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
            if (!empty($emailToSave)) {
                // Verificar si el email pertenece a otro usuario distinto
                $existingOtherUser = User::withTrashed()
                    ->with(['customer' => fn($q) => $q->withTrashed()])
                    ->whereRaw('LOWER(email) = ?', [$emailToSave])
                    ->when($user, fn($q) => $q->where('id', '!=', $user->id))
                    ->first();

                if ($existingOtherUser) {
                    $deletedAt = $existingOtherUser->deleted_at ?? $existingOtherUser->customer?->deleted_at;
                    if ($deletedAt === null) {
                        DB::rollBack();
                        return response()->json([
                            'field' => 'email',
                            'code' => 'EMAIL_ACTIVE_EXISTS',
                            'message' => "Advertencia: El correo '{$emailToSave}' ya está registrado en otra cuenta activa."
                        ], 422);
                    }

                    $daysDeleted = (int) floor(\Carbon\Carbon::parse($deletedAt)->diffInDays(now()));
                    if ($daysDeleted < 60) {
                        $daysRemaining = max(1, 60 - $daysDeleted);
                        DB::rollBack();
                        return response()->json([
                            'field' => 'email',
                            'code' => 'EMAIL_DELETED_UNDER_60_DAYS',
                            'days_deleted' => $daysDeleted,
                            'days_remaining' => $daysRemaining,
                            'message' => "Advertencia: El correo '{$emailToSave}' pertenece a una cuenta eliminada hace {$daysDeleted} día(s). Deben pasar 60 días para poder utilizarlo (faltan {$daysRemaining} día(s))."
                        ], 422);
                    }

                    // Liberar el email y username del usuario eliminado hace >= 60 días para no violar constraint único
                    DB::table('users')
                        ->where('id', $existingOtherUser->id)
                        ->update([
                            'email' => 'deleted_' . time() . '_' . $existingOtherUser->id . '@deleted.local',
                            'username' => null
                        ]);
                }

                if ($user) {
                    $username = $this->extractUsernameFromEmail($emailToSave, $user->id);

                    $user->update([
                        'email' => $emailToSave,
                        'username' => $username,
                        'is_active' => $customer->is_active
                    ]);

                    if ($request->has('password') && !empty($request->password)) {
                        $user->update(['password' => Hash::make($request->password)]);
                    }

                    $existingProfile = UserProfile::withTrashed()->where('user_id', $user->id)->first();
                    if ($existingProfile) {
                        if ($existingProfile->trashed()) {
                            $existingProfile->restore();
                        }
                        $existingProfile->update([
                            'first_name' => $firstName,
                            'last_name_paternal' => $lastNamePaternal,
                            'last_name_maternal' => $lastNameMaternal,
                            'phone' => $phone,
                        ]);
                    } else {
                        UserProfile::create([
                            'user_id' => $user->id,
                            'first_name' => $firstName,
                            'last_name_paternal' => $lastNamePaternal,
                            'last_name_maternal' => $lastNameMaternal,
                            'phone' => $phone,
                        ]);
                    }
                } else {
                    // Convert POS customer to Web Customer — generar contraseña temporal y username sin dominio
                    $temporaryPassword = Str::upper(Str::random(3)) . rand(100, 999) . Str::random(3);
                    $username = $this->extractUsernameFromEmail($emailToSave);

                    $newUser = User::create([
                        'email' => $emailToSave,
                        'username' => $username,
                        'password' => Hash::make($temporaryPassword),
                        'is_active' => $customer->is_active,
                        'email_verified_at' => now(),
                    ]);

                    UserProfile::create([
                        'user_id' => $newUser->id,
                        'first_name' => $firstName,
                        'last_name_paternal' => $lastNamePaternal,
                        'last_name_maternal' => $lastNameMaternal,
                        'phone' => $phone,
                    ]);

                    $customer->update(['user_id' => $newUser->id]);

                    // Assign roles
                    $customerRoles = Role::where('is_customer', true)->get();
                    if ($customerRoles->isNotEmpty()) {
                        $newUser->syncRoles($customerRoles);
                    }

                    // Enviar correo de bienvenida con contraseña temporal
                    try {
                        $loginUrl = rtrim(env('FRONTEND_URL', env('APP_URL', '')), '/') . '/login';
                        Mail::to($emailToSave)->send(new WelcomeCustomer(
                            $firstName,
                            $emailToSave,
                            $temporaryPassword,
                            $loginUrl
                        ));
                    } catch (\Exception $mailException) {
                        Log::warning('WelcomeCustomer email (update/convert) failed: ' . $mailException->getMessage());
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
                        'first_name' => $firstName,
                        'last_name_paternal' => $lastNamePaternal,
                        'last_name_maternal' => $lastNameMaternal,
                        'phone' => $phone,
                    ]);
                } else if (!$user) {
                    PosCustomerProfile::create([
                        'customer_id' => $customer->id,
                        'first_name' => $firstName,
                        'last_name_paternal' => $lastNamePaternal,
                        'last_name_maternal' => $lastNameMaternal,
                        'phone' => $phone,
                    ]);
                }
            }

            DB::commit();

            return response()->json(Customer::with(['user.profile', 'posProfile'])->find($customer->id));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al actualizar el cliente: ' . $e->getMessage(), 'error' => $e->getMessage()], 500);
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
        return \Illuminate\Support\Facades\Cache::remember('admin_customer_kpis', 60, function() {
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
        });
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

