<?php

namespace App\Http\Controllers\Logistics;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Sales\Cart;
use App\Models\Sales\Sale;
use App\Models\Sales\SaleDetail;
use App\Models\Base\Guest;
use App\Models\Logistics\Shipment;
use App\Models\Logistics\DeliverySchedule;
use App\Models\Inventory\StockReservation;

class OrderNetworkController extends Controller
{
    /**
     * List delivery schedules for the admin dashboard.
     */
    public function index(Request $request)
    {
        $query = DeliverySchedule::with([
            'shipment.sale.guest',
            'shipment.sale.customer.user',
            'driver',
            'zone'
        ])->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('shipment', function($q) use ($search) {
                $q->where('tracking_code', 'like', "%{$search}%")
                  ->orWhereHas('sale', function($q2) use ($search) {
                      $q2->whereHas('guest', function($q3) use ($search) {
                          $q3->where('name', 'like', "%{$search}%");
                      });
                  });
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('delivery_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('delivery_date', '<=', $request->date_to);
        }

        $schedules = $query->paginate($request->get('per_page', 15));
        return response()->json($schedules);
    }

    /**
     * List delivery drivers.
     */
    public function getDrivers()
    {
        $drivers = \App\Models\Logistics\DeliveryDriver::with('user')->get();
        return response()->json($drivers);
    }

    /**
     * Converts a Cart to an Order Network Sale (pending) and schedules the delivery.
     */
    public function convertToOrder(Request $request)
    {
        $request->validate([
            'cart_id' => 'required|uuid|exists:carts,id',
            'branch_id' => 'required|uuid|exists:branches,id',
            'meeting_point' => 'required|string',
            'scheduled_date' => 'required|date',
            'time_window' => 'required|string',
            'guest_name' => 'nullable|string',
            'guest_phone' => 'nullable|string',
            'customer_id' => 'nullable|uuid|exists:customers,id'
        ]);

        try {
            DB::beginTransaction();

            $cart = Cart::with('items.product_variant')->findOrFail($request->cart_id);

            // Handle Guest or Customer
            $guestId = null;
            $customerId = $request->customer_id;

            if (!$customerId && $request->guest_name) {
                // If it's a guest, create or find guest record (by phone to avoid duplicates if possible, or just create)
                $guest = Guest::firstOrCreate(
                    ['whatsapp_phone' => $request->guest_phone],
                    ['name' => $request->guest_name]
                );
                $guestId = $guest->id;
            }

            // Create Sale
            $sale = Sale::create([
                'customer_id' => $customerId,
                'guest_id' => $guestId,
                'branch_id' => $request->branch_id,
                'user_id' => auth()->id() ?? null,
                'sale_type' => 'online', // Or perhaps 'delivery'
                'status' => 'pending',
                'source' => 'order_network',
                'subtotal' => 0, // Will calculate below
                'discount_total' => $cart->total_discount,
                'total_discount' => $cart->total_discount,
                'total' => 0,
            ]);

            $subtotal = 0;

            foreach ($cart->items as $item) {
                $price = $item->product_variant->price ?? 0;
                $lineTotal = $price * $item->quantity;
                $subtotal += $lineTotal;

                // Create Sale Detail
                SaleDetail::create([
                    'sale_id' => $sale->id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $price,
                    'subtotal' => $lineTotal
                ]);

                // Create Stock Reservation (from this specific branch)
                StockReservation::create([
                    'variant_id' => $item->variant_id,
                    'branch_id' => $request->branch_id,
                    'sale_id' => $sale->id,
                    'quantity' => $item->quantity,
                    'status' => 'reserved'
                ]);
            }

            // Update sale totals
            $sale->subtotal = $subtotal;
            $sale->total = max(0, $subtotal - $sale->total_discount);
            $sale->save();

            // Create Shipment
            $shipment = Shipment::create([
                'sale_id' => $sale->id,
                'status' => 'pending',
            ]);

            // Create Delivery Schedule
            $schedule = DeliverySchedule::create([
                'shipment_id' => $shipment->id,
                'scheduled_date' => $request->scheduled_date,
                'time_window' => $request->time_window,
                'meeting_point' => $request->meeting_point,
                'status' => 'pending'
            ]);

            // Clear Cart (or delete it)
            $cart->items()->delete();
            $cart->delete();

            DB::commit();

            return response()->json([
                'message' => 'Order and delivery scheduled successfully',
                'schedule_id' => $schedule->id,
                'sale_id' => $sale->id
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get details for the public delivery confirmation link.
     */
    public function getDeliveryDetails($id)
    {
        $schedule = DeliverySchedule::with([
            'shipment.sale.sale_details.variant.product', 
            'shipment.sale.guest', 
            'shipment.sale.customer'
        ])->findOrFail($id);

        return response()->json([
            'schedule' => $schedule
        ]);
    }

    /**
     * Customer confirms the delivery schedule from the public link.
     */
    public function confirmDelivery(Request $request, $id)
    {
        $schedule = DeliverySchedule::findOrFail($id);
        
        if ($schedule->status !== 'pending') {
            return response()->json(['error' => 'Schedule is not pending'], 400);
        }

        $schedule->status = 'assigned'; // Assuming 'assigned' means ready to be delivered / confirmed
        $schedule->save();

        return response()->json([
            'message' => 'Delivery confirmed successfully'
        ]);
    }

    /**
     * Update delivery status (Driver/Admin endpoint).
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:on_the_way,at_the_meeting_point,completed,cancelled'
        ]);

        try {
            DB::beginTransaction();

            $schedule = DeliverySchedule::with('shipment.sale')->findOrFail($id);
            $schedule->status = $request->status;
            $schedule->save();

            if ($request->status === 'completed') {
                $shipment = $schedule->shipment;
                $shipment->status = 'delivered';
                $shipment->delivered_at = now();
                $shipment->save();

                $sale = $shipment->sale;
                $sale->status = 'paid';
                $sale->save();

                // Confirm stock reservations
                StockReservation::where('sale_id', $sale->id)
                    ->update(['status' => 'confirmed']);
            } elseif ($request->status === 'cancelled') {
                $shipment = $schedule->shipment;
                $shipment->status = 'cancelled';
                $shipment->save();

                $sale = $shipment->sale;
                $sale->status = 'cancelled';
                $sale->save();

                // Release stock reservations
                StockReservation::where('sale_id', $sale->id)
                    ->update(['status' => 'released']); // or deleted
            } else {
                // For on_the_way or at_the_meeting_point
                $shipment = $schedule->shipment;
                $shipment->status = $request->status;
                $shipment->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Delivery status updated successfully.',
                'status' => $schedule->status
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Assign driver to delivery schedule.
     */
    public function assignDriver(Request $request, $id)
    {
        $request->validate([
            'driver_id' => 'required|uuid|exists:delivery_drivers,id'
        ]);

        $schedule = DeliverySchedule::findOrFail($id);
        $schedule->driver_id = $request->driver_id;
        $schedule->status = 'assigned';
        $schedule->save();

        return response()->json([
            'message' => 'Driver assigned successfully.',
            'schedule' => $schedule
        ]);
    }
}
