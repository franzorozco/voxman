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
            'subtotal' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|uuid',
            'items.*.line_subtotal' => 'required|numeric|min:0',
            'items.*.quantity' => 'nullable|integer|min:1',
            'customer_id' => 'nullable|uuid'
        ]);

        $result = $this->discountService->validateCode(
            $request->code,
            $request->subtotal,
            $request->items,
            $request->customer_id,
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