<?php

namespace App\Http\Controllers\Api\Shop;

use App\Http\Controllers\Controller;
use App\Models\Shop\ShopShort;
use Illuminate\Http\Request;

class ShopShortController extends Controller
{
    /**
     * Fetch active shorts for the shop UI
     */
    public function index(Request $request)
    {
        $shorts = ShopShort::with(['product' => function($q) {
            $q->select('id', 'name', 'slug', 'base_price');
        }])
        ->where('is_active', true)
        ->orderBy('priority', 'desc')
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($shorts);
    }
}
