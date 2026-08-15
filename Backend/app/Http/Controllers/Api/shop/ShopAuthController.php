<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ShopAuthController extends Controller
{
    public function login(Request $request)
    {
        // Implement customer login logic using Sanctum
        return response()->json(['message' => 'Login not implemented yet']);
    }

    public function register(Request $request)
    {
        // Implement customer registration logic
        return response()->json(['message' => 'Register not implemented yet']);
    }

    public function profile(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
