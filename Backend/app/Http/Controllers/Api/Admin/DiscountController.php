<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Discount\Discount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiscountController extends Controller
{
    public function index()
    {
        $discounts = Discount::with(['brands', 'discount_categories.category', 'products', 'variants', 'branches', 'customers', 'employees'])->get();
        return response()->json($discounts);
    }

    public function deleted()
    {
        $discounts = Discount::onlyTrashed()->with(['brands', 'discount_categories.category', 'products', 'variants', 'branches', 'customers', 'employees'])->get();
        return response()->json($discounts);
    }

    public function show($id)
    {
        $discount = Discount::with(['brands', 'discount_categories.category', 'products', 'variants', 'branches', 'customers', 'employees'])->withTrashed()->findOrFail($id);
        return response()->json($discount);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:6|alpha_num|unique:discounts,code',
            'type' => 'required|string|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'is_automatic' => 'boolean',
            'min_purchase_amount' => 'nullable|numeric|min:0',
            'min_quantity' => 'nullable|integer|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'active' => 'boolean',

            // Targets
            'brands' => 'array',
            'brands.*' => 'integer|exists:brands,id',
            'categories' => 'array',
            'categories.*' => 'uuid|exists:categories,id',
            'products' => 'array',
            'products.*' => 'uuid|exists:products,id',
            'variants' => 'array',
            'variants.*' => 'uuid|exists:product_variants,id',
            'branches' => 'array',
            'branches.*' => 'uuid|exists:branches,id',
            'customers' => 'array',
            'customers.*' => 'uuid|exists:customers,id',
            'employees' => 'array',
            'employees.*' => 'uuid|exists:employees,id',
        ]);

        DB::beginTransaction();
        try {
            $discount = Discount::create($request->except(['brands', 'categories', 'products', 'variants', 'branches', 'customers', 'employees']));

            if (!empty($validated['brands'])) $discount->brands()->sync($validated['brands']);
            if (!empty($validated['categories']) && method_exists($discount, 'categories')) $discount->categories()->sync($validated['categories']);
            if (!empty($validated['products'])) $discount->products()->sync($validated['products']);
            if (!empty($validated['variants'])) $discount->variants()->sync($validated['variants']);
            if (!empty($validated['branches'])) $discount->branches()->sync($validated['branches']);
            if (!empty($validated['customers'])) $discount->customers()->sync($validated['customers']);
            if (!empty($validated['employees'])) $discount->employees()->sync($validated['employees']);

            DB::commit();

            return response()->json([
                'message' => 'Promoción creada',
                'data' => $discount->load(['brands', 'categories', 'products', 'variants', 'branches', 'customers', 'employees'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al crear', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $discount = Discount::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:6|alpha_num|unique:discounts,code,' . $id,
            'type' => 'required|string|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'is_automatic' => 'boolean',
            'min_purchase_amount' => 'nullable|numeric|min:0',
            'min_quantity' => 'nullable|integer|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'active' => 'boolean',

            // Targets
            'brands' => 'array',
            'brands.*' => 'integer|exists:brands,id',
            'categories' => 'array',
            'categories.*' => 'uuid|exists:categories,id',
            'products' => 'array',
            'products.*' => 'uuid|exists:products,id',
            'variants' => 'array',
            'variants.*' => 'uuid|exists:product_variants,id',
            'branches' => 'array',
            'branches.*' => 'uuid|exists:branches,id',
            'customers' => 'array',
            'customers.*' => 'uuid|exists:customers,id',
            'employees' => 'array',
            'employees.*' => 'uuid|exists:employees,id',
        ]);

        DB::beginTransaction();
        try {
            $discount->update($request->except(['brands', 'categories', 'products', 'variants', 'branches', 'customers', 'employees']));

            if (isset($validated['brands'])) $discount->brands()->sync($validated['brands']);
            if (isset($validated['categories']) && method_exists($discount, 'categories')) $discount->categories()->sync($validated['categories']);
            if (isset($validated['products'])) $discount->products()->sync($validated['products']);
            if (isset($validated['variants'])) $discount->variants()->sync($validated['variants']);
            if (isset($validated['branches'])) $discount->branches()->sync($validated['branches']);
            if (isset($validated['customers'])) $discount->customers()->sync($validated['customers']);
            if (isset($validated['employees'])) $discount->employees()->sync($validated['employees']);

            DB::commit();

            return response()->json([
                'message' => 'Promoción actualizada',
                'data' => $discount->load(['brands', 'categories', 'products', 'variants', 'branches', 'customers', 'employees'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al actualizar', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $discount = Discount::findOrFail($id);
        $discount->delete();
        return response()->json(['message' => 'Promoción desactivada']);
    }

    public function restore($id)
    {
        $discount = Discount::onlyTrashed()->findOrFail($id);
        $discount->restore();
        return response()->json(['message' => 'Promoción restaurada']);
    }

    public function forceDestroy($id)
    {
        $discount = Discount::onlyTrashed()->findOrFail($id);
        $discount->forceDelete();
        return response()->json(['message' => 'Promoción eliminada permanentemente']);
    }
}
