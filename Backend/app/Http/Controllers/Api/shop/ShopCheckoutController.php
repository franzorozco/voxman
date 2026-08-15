<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class ShopCheckoutController extends Controller
{
    public function process(Request $request)
    {
        $cartToken = $request->header('X-Cart-Token');

        if (!$cartToken) {
            return response()->json(['message' => 'No cart token provided'], 400);
        }

        $cartData = Redis::get("cart:{$cartToken}");

        if (!$cartData) {
            return response()->json(['message' => 'Cart is empty or expired'], 400);
        }

        // Logic to process payment, create a Sale record, and clear the cart
        // ...
        
        // After successful checkout, remove the cart from Redis
        Redis::del("cart:{$cartToken}");

        return response()->json([
            'message' => 'Checkout processed successfully',
            'order_id' => '12345' // Replace with actual order ID
        ]);
    }
}
