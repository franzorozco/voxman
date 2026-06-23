<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use App\Models\Catalog\ProductVariant;
use Illuminate\Http\Request;

class PosProductController extends Controller
{
    /**
     * Get a list of products with their variants and stock for the POS grid.
     * We only return products that have stock in the provided branch_id.
     */
    public function index(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|uuid|exists:branches,id',
            'search' => 'nullable|string',
            'category_id' => 'nullable|uuid|exists:categories,id',
        ]);

        $branchId = $request->branch_id;
        $search = $request->search;
        $categoryId = $request->category_id;

        $products = Product::where('is_active', true)
            ->with(['images' => function ($query) {
                $query->where('is_main', true);
            }, 'variants' => function ($query) use ($branchId) {
                $query->where('is_active', true)
                    ->with(['inventories' => function ($q) use ($branchId) {
                        $q->where('branch_id', $branchId);
                    }, 'size', 'attributeValues.attribute']);
            }])
            ->whereHas('variants.inventories', function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)->where('stock', '>', 0);
            });

        if ($search) {
            $products->where(function ($q) use ($search) {
                $q->where('name', 'ilike', '%' . $search . '%')
                  ->orWhereHas('variants', function ($q2) use ($search) {
                      $q2->where('sku', 'ilike', '%' . $search . '%')
                         ->orWhere('barcode', $search);
                  });
            });
        }

        if ($categoryId) {
            $products->where('category_id', $categoryId);
        }

        $result = $products->paginate(24);

        // Transform slightly for POS consumption
        $result->getCollection()->transform(function ($product) use ($branchId) {
            $variantsWithStock = collect($product->variants)->filter(function ($variant) use ($branchId) {
                $inventory = collect($variant->inventories)->firstWhere('branch_id', $branchId);
                return $inventory && $inventory->stock > 0;
            })->map(function ($variant) use ($branchId) {
                $inventory = collect($variant->inventories)->firstWhere('branch_id', $branchId);
                return [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'barcode' => $variant->barcode,
                    'price' => $variant->price ?? $variant->product->base_price,
                    'stock' => $inventory->stock,
                    'size' => $variant->size ? $variant->size->name : null,
                    'attributes' => $variant->attributeValues->map(function($attrVal) {
                        return [
                            'name' => $attrVal->attribute->name,
                            'value' => $attrVal->value
                        ];
                    })
                ];
            })->values();

            return [
                'id' => $product->id,
                'name' => $product->name,
                'base_price' => $product->base_price,
                'image' => collect($product->images)->first()->url ?? null,
                'variants' => $variantsWithStock
            ];
        });

        return response()->json($result);
    }

    /**
     * Quickly search a specific variant by barcode.
     */
    public function searchByBarcode(Request $request)
    {
        $request->validate([
            'barcode' => 'required|string',
            'branch_id' => 'required|uuid|exists:branches,id',
        ]);

        $barcode = $request->barcode;
        $branchId = $request->branch_id;

        $variant = ProductVariant::where('barcode', $barcode)
            ->where('is_active', true)
            ->with(['product.images' => function ($query) {
                $query->where('is_main', true);
            }, 'inventories' => function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            }, 'size', 'attributeValues.attribute'])
            ->first();

        if (!$variant) {
            return response()->json(['message' => 'Producto no encontrado.'], 404);
        }

        $inventory = collect($variant->inventories)->firstWhere('branch_id', $branchId);

        if (!$inventory || $inventory->stock <= 0) {
            return response()->json(['message' => 'Producto sin stock en esta sucursal.'], 400);
        }

        return response()->json([
            'id' => $variant->id,
            'product_id' => $variant->product_id,
            'name' => $variant->product->name,
            'sku' => $variant->sku,
            'barcode' => $variant->barcode,
            'price' => $variant->price ?? $variant->product->base_price,
            'stock' => $inventory->stock,
            'image' => collect($variant->product->images)->first()->url ?? null,
            'size' => $variant->size ? $variant->size->name : null,
            'attributes' => $variant->attributeValues->map(function($attrVal) {
                return [
                    'name' => $attrVal->attribute->name,
                    'value' => $attrVal->value
                ];
            })
        ]);
    }
}
