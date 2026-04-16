<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Core\User;
use App\Models\Core\UserProfile;
use App\Models\Actors\Customer;

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
                    'first_name' => $request->first_name,
                    'last_name_paternal' => $request->last_name_paternal,
                    'phone' => $request->phone,
                ]);

                Customer::create([
                    'user_id' => $user->id,
                    'customer_code' => 'CUST-' . uniqid(),
                ]);

                $token = $user->createToken('auth_token')->plainTextToken;

                return [
                    'user' => $user,
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