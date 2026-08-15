<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class ShopCartController extends Controller
{
    /**
     * Get the current cart from Redis using the cart token.
     */
    public function show(Request $request)
    {
        $cartToken = $request->header('X-Cart-Token');

        if (!$cartToken) {
            return response()->json(['items' => [], 'total' => 0]);
        }

        $cartData = Redis::get("cart:{$cartToken}");

        if ($cartData) {
            return response()->json(json_decode($cartData, true));
        }

        return response()->json(['items' => [], 'total' => 0]);
    }

    /**
     * Add an item to the cart. If no token is provided, generate a new one.
     */
    public function add(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer',
            'variant_id' => 'nullable|integer',
            'quantity' => 'required|integer|min:1',
        ]);

        $cartToken = $request->header('X-Cart-Token');

        if (!$cartToken) {
            $cartToken = 'cart_' . Str::uuid()->toString();
            $cartData = ['items' => [], 'total' => 0];
        } else {
            $cartData = json_decode(Redis::get("cart:{$cartToken}"), true) ?? ['items' => [], 'total' => 0];
        }

        // Simplistic add logic (you'll want to check if product already exists to increase qty)
        $cartData['items'][] = [
            'product_id' => $request->product_id,
            'variant_id' => $request->variant_id,
            'quantity' => $request->quantity,
            // Calculate price...
        ];

        // Save back to Redis with 48 hours expiration
        Redis::setex("cart:{$cartToken}", 48 * 60 * 60, json_encode($cartData));

        return response()->json([
            'cart_token' => $cartToken,
            'cart' => $cartData
        ]);
    }

    public function update(Request $request)
    {
        // Implement logic to update quantity of an item
        return response()->json(['message' => 'Not implemented yet']);
    }

    public function remove(Request $request)
    {
        // Implement logic to remove an item
        return response()->json(['message' => 'Not implemented yet']);
    }
}
