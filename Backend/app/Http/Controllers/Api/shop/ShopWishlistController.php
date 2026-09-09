<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Wishlist\Wishlist;
use App\Models\Wishlist\WishlistItem; // wait, let's just use App\Models\Base\WishlistItem if the specific one doesn't exist, but typically they exist in Models\Base\WishlistItem
use Illuminate\Support\Facades\DB;

class ShopWishlistController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->customer) {
            return response()->json(['items' => []]);
        }
        $wishlist = DB::table('wishlists')->where('customer_id', $user->customer->id)->first();
        if (!$wishlist) {
            $wishlistId = (string) \Illuminate\Support\Str::uuid();
            DB::table('wishlists')->insert([
                'id' => $wishlistId,
                'customer_id' => $user->customer->id,
                'created_at' => now(),
            ]);
            $wishlist = DB::table('wishlists')->where('id', $wishlistId)->first();
        }

        return response()->json([
            'items' => DB::table('wishlist_items')->where('wishlist_id', $wishlist->id)->get()
        ]);
    }

    public function toggle(Request $request)
    {
        $request->validate([
            'product_id' => 'required|uuid',
            'variant_id' => 'nullable|uuid',
        ]);

        $user = $request->user();
        if (!$user || !$user->customer) {
            return response()->json(['message' => 'Solo clientes pueden usar la lista de deseos.'], 403);
        }

        $wishlist = DB::table('wishlists')->where('customer_id', $user->customer->id)->first();
        if (!$wishlist) {
            $wishlistId = (string) \Illuminate\Support\Str::uuid();
            DB::table('wishlists')->insert([
                'id' => $wishlistId,
                'customer_id' => $user->customer->id,
                'created_at' => now(),
            ]);
            $wishlist = DB::table('wishlists')->where('id', $wishlistId)->first();
        }

        $existing = DB::table('wishlist_items')
            ->where('wishlist_id', $wishlist->id)
            ->where('product_id', $request->product_id)
            ->where('variant_id', $request->variant_id)
            ->first();

        if ($existing) {
            DB::table('wishlist_items')->where('id', $existing->id)->delete();
            return response()->json(['status' => 'removed', 'items' => DB::table('wishlist_items')->where('wishlist_id', $wishlist->id)->get()]);
        } else {
            DB::table('wishlist_items')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'wishlist_id' => $wishlist->id,
                'product_id' => $request->product_id,
                'variant_id' => $request->variant_id,
                'created_at' => now(),
            ]);
            return response()->json(['status' => 'added', 'items' => DB::table('wishlist_items')->where('wishlist_id', $wishlist->id)->get()]);
        }
    }
}

