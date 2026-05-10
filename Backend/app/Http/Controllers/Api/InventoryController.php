<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Inventory;

class InventoryController extends Controller
{
    public function index()
    {
        $inventories = Inventory::with([
            'branch',
            'variant.product',
        ])->get();

        return response()->json($inventories);
    }
}