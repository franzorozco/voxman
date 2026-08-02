<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Base\Guest;
use App\Models\Sales\Sale;
use Illuminate\Http\Request;

class GuestController extends Controller
{
    /**
     * Search guests by name or phone
     */
    public function search(Request $request)
    {
        $query = $request->query('q', '');

        $guests = Guest::where('whatsapp_phone', 'ILIKE', "%{$query}%")
            ->orWhere('name', 'ILIKE', "%{$query}%")
            ->limit(15)
            ->get();

        return response()->json($guests);
    }

    /**
     * Get the history of a guest (sales and shipments)
     */
    public function history($id)
    {
        $guest = Guest::find($id);

        if (!$guest) {
            return response()->json(['message' => 'Guest not found'], 404);
        }

        $sales = Sale::with([
            'sale_details.product_variant.product.product_images',
            'sale_details.product_variant.variant_images',
            'sale_details.product_variant.size',
            'sale_details.product_variant.fit',
            'sale_details.product_variant.variant_attribute_values.attribute_value.attribute',
            'shipments.delivery_schedule.driver.user.profile',
            'shipments.tracking_history',
            'shipments.address',
            'branch'
        ])
        ->where('guest_id', $id)
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json([
            'guest' => $guest,
            'sales' => $sales
        ]);
    }
}
