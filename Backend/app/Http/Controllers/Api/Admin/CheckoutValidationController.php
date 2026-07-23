<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Finance\DiscountValidationService;

class CheckoutValidationController extends Controller
{
    protected $discountService;

    public function __construct(DiscountValidationService $discountService)
    {
        $this->discountService = $discountService;
    }

    /**
     * Validates a discount or giftcard code for a generic set of items.
     * Can be used by POS, Ecommerce Cart, or Logistics Delivery.
     */
    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
            'items' => 'required|array',
            'items.*.variant_id' => 'required|uuid',
            'items.*.line_subtotal' => 'required|numeric',
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'branch_id' => 'nullable|uuid|exists:branches,id',
        ]);

        $result = $this->discountService->validateCode(
            $request->code,
            $request->subtotal,
            $request->items,
            $request->customer_id,
            $request->branch_id
        );

        if (!$result['valid']) {
            return response()->json([
                'message' => $result['message'],
                'valid' => false
            ], 400);
        }

        return response()->json($result);
    }
}
