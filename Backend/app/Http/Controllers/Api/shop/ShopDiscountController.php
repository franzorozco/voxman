<?php
namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Finance\DiscountValidationService;

class ShopDiscountController extends Controller
{
    protected $discountService;

    public function __construct(DiscountValidationService $discountService)
    {
        $this->discountService = $discountService;
    }

    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'customer_id' => 'nullable|string'
        ]);

        $cartToken = $request->header('X-Cart-Token');
        if (!$cartToken) {
            return response()->json(['valid' => false, 'message' => 'No cart token provided'], 400);
        }

        $cartData = \Illuminate\Support\Facades\Cache::get("cart:{$cartToken}");
        $cartData = $cartData ? json_decode($cartData, true) : null;

        if (!$cartData || empty($cartData['items'])) {
            return response()->json(['valid' => false, 'message' => 'Cart is empty or not found'], 400);
        }

        // Calculate subtotal and items strictly from server cache
        $serverSubtotal = 0;
        $serverItems = [];
        foreach ($cartData['items'] as $item) {
            $lineSubtotal = $item['price'] * $item['quantity'];
            $serverSubtotal += $lineSubtotal;
            $serverItems[] = [
                'variant_id' => $item['variant_id'],
                'quantity' => $item['quantity'],
                'line_subtotal' => $lineSubtotal,
                'bundle_group_id' => $item['bundle_group_id'] ?? null
            ];
        }

        // Security check for customer_id
        $customerId = $request->customer_id;
        if ($customerId) {
            $user = auth('sanctum')->user();
            if (!$user) {
                $customerId = null; // Don't trust customer_id if not authenticated
            } else {
                // Verify the customer belongs to this user, or if they are the same id
                $validCustomer = \App\Models\Actors\Customer::where('id', $customerId)
                                    ->where('user_id', $user->id)
                                    ->exists();
                if (!$validCustomer && $user->id !== $customerId) {
                    $customerId = null;
                }
            }
        }

        $result = $this->discountService->validateCode(
            $request->code,
            $serverSubtotal,
            $serverItems,
            $customerId,
            null // no branch ID known during web checkout
        );

        if (!$result['valid']) {
            return response()->json([
                'valid' => false,
                'message' => $result['message']
            ], 422);
        }

        return response()->json($result);
    }
}