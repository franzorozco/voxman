<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Core\User;
use App\Models\Core\UserProfile;

class RegisterController extends Controller
{
    public function __invoke(RegisterRequest $request)
    {
        try {
            $data = DB::transaction(function () use ($request) {

                $user = User::create([
                    'email' => $request->email,
                    'username' => $request->username,
                    'password' => Hash::make($request->password),
                ]);

                UserProfile::create([
                    'user_id' => $user->id,
                    'first_name' => $request->first_name ?? $request->username,
                    'last_name_paternal' => $request->last_name_paternal,
                    'phone' => $request->phone,
                ]);

                // ✅ AQUÍ asignas el rol correctamente
                $user->assignRole('Usuario');

                $user->loadMissing('profile', 'customers.addresses', 'employee.branch');

                $token = $user->createToken('auth_token')->plainTextToken;

                return [
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'username' => $user->username,
                        'full_name' => optional($user->profile)->first_name . ' ' . optional($user->profile)->last_name_paternal,
                        'photo' => optional($user->profile)->photo ?? null,
                        'employee' => null,
                        'roles' => $user->getRoleNames(), 
                        'permissions' => $user->getAllPermissions()->pluck('name'),
                        'profile' => $user->profile,
                        'customers' => $user->customers,
                    ],
                    'token' => $token,
                ];
            });

            return response()->json($data, 201);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error en registro',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}