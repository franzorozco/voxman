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
use App\Models\Logistics\DeliveryZone;
use App\Models\Inventory\StockReservation;
use App\Models\Inventory\Inventory;
use App\Models\Inventory\InventoryMovement;

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
            'driver.user.profile'
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
        $employees = \App\Models\Actors\Employee::with('user.profile')->where('is_active', true)->get();
        return response()->json($employees);
    }

    /**
     * List predefined delivery zones.
     */
    public function getDeliveryZones()
    {
        $zones = DeliveryZone::all();
        return response()->json($zones);
    }

    /**
     * Create a new delivery zone.
     */
    public function createDeliveryZone(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'base_cost' => 'required|numeric|min:0',
            'extra_cost_per_km' => 'required|numeric|min:0',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        try {
            $zone = DeliveryZone::create($request->only([
                'name', 'city', 'base_cost', 'extra_cost_per_km', 'latitude', 'longitude'
            ]));

            return response()->json([
                'message' => 'Zona de entrega creada exitosamente',
                'zone' => $zone
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update an existing delivery zone.
     */
    public function updateDeliveryZone(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'base_cost' => 'required|numeric|min:0',
            'extra_cost_per_km' => 'required|numeric|min:0',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        try {
            $zone = DeliveryZone::findOrFail($id);
            $zone->update($request->only([
                'name', 'city', 'base_cost', 'extra_cost_per_km', 'latitude', 'longitude'
            ]));

            return response()->json([
                'message' => 'Zona de entrega actualizada exitosamente',
                'zone' => $zone
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Converts a Cart to an Order Network Sale (pending) and schedules the delivery.
     */
    public function convertToOrder(Request $request)
    {
        $request->validate([
            'cart_id' => 'required|uuid|exists:carts,id',
            'branch_id' => 'required|uuid|exists:branches,id',
            'items_branches' => 'nullable|array',
            'items_branches.*.variant_id' => 'required_with:items_branches|uuid|exists:product_variants,id',
            'items_branches.*.branch_id' => 'required_with:items_branches|uuid|exists:branches,id',
            'meeting_point' => 'required|string',
            'scheduled_date' => 'required|date',
            'time_window' => 'required|string',
            'guest_name' => 'nullable|string',
            'guest_phone' => 'nullable|string',
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'driver_id' => 'nullable|uuid|exists:employees,id',
            'save_as_draft' => 'nullable|boolean',
            'shipping_cost' => 'nullable|numeric|min:0'
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
                'invoice_number' => 'DLV-' . strtoupper(\Illuminate\Support\Str::random(6)),
                'sale_type' => 'online', // Or perhaps 'delivery'
                'status' => 'pending',
                'source' => 'order_network',
                'subtotal' => 0, // Will calculate below
                'discount_total' => $cart->total_discount,
                'total' => 0,
                'notes' => 'Proviene de Carrito/Proforma: ' . $cart->reference_number
            ]);

            $subtotal = 0;

            $itemsBranches = collect($request->input('items_branches', []))->keyBy('variant_id');

            foreach ($cart->items as $item) {
                $price = $item->product_variant->price ?? 0;
                $discountAmount = $item->discount_amount ?? 0;
                $finalPrice = max(0, $price - $discountAmount);
                $lineTotal = $finalPrice * $item->quantity;
                
                $subtotal += $lineTotal;

                // Create Sale Detail
                SaleDetail::create([
                    'sale_id' => $sale->id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $price,
                    'discount' => $discountAmount,
                    'final_price' => $finalPrice,
                    'subtotal' => $lineTotal
                ]);

                // Determine branch to reserve from (per item fallback to main branch)
                $reserveBranchId = $request->branch_id;
                if ($itemsBranches->has($item->variant_id)) {
                    $reserveBranchId = $itemsBranches->get($item->variant_id)['branch_id'];
                }

                // Deduct stock for reservation
                $inventory = Inventory::where('branch_id', $reserveBranchId)
                    ->where('variant_id', $item->variant_id)
                    ->lockForUpdate()
                    ->first();

                if (!$inventory || $inventory->stock < $item->quantity) {
                    throw new \Exception("Stock insuficiente para el producto.");
                }

                $stockBefore = $inventory->stock;
                $inventory->stock -= $item->quantity;
                $inventory->save();

                InventoryMovement::create([
                    'variant_id' => $item->variant_id,
                    'branch_id' => $reserveBranchId,
                    'movement_type' => 'sale',
                    'quantity' => (int) $item->quantity,
                    'stock_before' => $stockBefore,
                    'stock_after' => $inventory->stock,
                    'reference_type' => 'sale',
                    'reference_id' => $sale->id,
                    'created_by' => auth()->id() ?? null,
                ]);

                // Create Stock Reservation
                StockReservation::create([
                    'variant_id' => $item->variant_id,
                    'branch_id' => $reserveBranchId,
                    'sale_id' => $sale->id,
                    'quantity' => $item->quantity,
                    'status' => 'reserved'
                ]);
            }

            // Update sale totals
            $shippingCost = $request->input('shipping_cost', 0);
            $sale->subtotal = $subtotal;
            $sale->total = max(0, $subtotal + $shippingCost - $sale->total_discount);
            $sale->save();

            // Create Shipment
            $shipment = Shipment::create([
                'sale_id' => $sale->id,
                'status' => 'pending',
                'shipping_cost' => $shippingCost,
                'delivery_code' => str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT)
            ]);

            // Create Delivery Schedule
            $schedule = DeliverySchedule::create([
                'shipment_id' => $shipment->id,
                'scheduled_date' => $request->scheduled_date,
                'time_window' => $request->time_window,
                'meeting_point' => $request->meeting_point,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'driver_id' => $request->driver_id,
                'status' => $request->boolean('save_as_draft') ? 'pending' : 'assigned'
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
            \Illuminate\Support\Facades\Log::error('OrderNetwork Convert Error: ' . $e->getMessage() . ' Trace: ' . $e->getTraceAsString());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get details for the public delivery confirmation link.
     */
    public function getDeliveryDetails($id)
    {
        $schedule = DeliverySchedule::with([
            'shipment.sale.sale_details' => function($q) { 
                $q->withTrashed()->with([
                    'product_variant.product.product_images', 
                    'product_variant.product.attribute_value_images',
                    'product_variant.variant_images',
                    'product_variant.size',
                    'product_variant.fit',
                    'product_variant.variant_attribute_values.attribute_value.attribute'
                ]); 
            },
            'shipment.sale.guest', 
            'shipment.sale.customer',
            'shipment.sale.payments.payment_method',
            'driver.user.profile'
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
                
                // --- PAYMENT AND DISCOUNT LOGIC ---
                $amountPaid = $request->input('monto_real');
                if ($amountPaid !== null) {
                    $amountPaid = (float) $amountPaid;
                    $discountDiff = max(0, $sale->total - $amountPaid);

                    if ($discountDiff > 0) {
                        // Apply proportional discount to items
                        $details = $sale->sale_details()->whereNull('deleted_at')->get();
                        $totalPriceBeforeDiff = $details->sum('subtotal');

                        foreach ($details as $detail) {
                            $ratio = $totalPriceBeforeDiff > 0 ? ($detail->subtotal / $totalPriceBeforeDiff) : 0;
                            $detailDiscount = $discountDiff * $ratio;
                            
                            $unitDiscount = $detailDiscount / $detail->quantity;
                            
                            // User asked to use 'discount' column specifically, though we'll update both for compatibility
                            $detail->discount = ($detail->discount ?? 0) + $unitDiscount;
                            $detail->final_price = max(0, $detail->unit_price - $detail->discount);
                            $detail->subtotal = $detail->final_price * $detail->quantity;
                            $detail->save();
                        }

                        $sale->discount_total = ($sale->discount_total ?? 0) + $discountDiff;
                        $sale->total = $amountPaid;
                    }

                    // Create Payment Records
                    $paymentMethodType = $request->input('payment_method'); // 'efectivo', 'qr', 'ambos'
                    
                    if ($paymentMethodType) {
                        $cashMethodId = \App\Models\Finance\PaymentMethod::whereRaw('LOWER(name) = ?', ['efectivo'])->value('id');
                        $qrMethodId = \App\Models\Finance\PaymentMethod::whereRaw('LOWER(name) = ?', ['qr'])->value('id');
                        
                        // Default to cash register of the branch, if available
                        $cashRegisterId = \App\Models\Finance\CashRegister::where('branch_id', $sale->branch_id)->where('status', 'open')->value('id');
                        
                        if ($paymentMethodType === 'efectivo' && $cashMethodId) {
                            \App\Models\Finance\Payment::create([
                                'sale_id' => $sale->id,
                                'payment_method_id' => $cashMethodId,
                                'cash_register_id' => $cashRegisterId,
                                'amount' => $amountPaid,
                                'status' => 'completed'
                            ]);
                        } elseif ($paymentMethodType === 'qr' && $qrMethodId) {
                            \App\Models\Finance\Payment::create([
                                'sale_id' => $sale->id,
                                'payment_method_id' => $qrMethodId,
                                'cash_register_id' => $cashRegisterId,
                                'amount' => $amountPaid,
                                'status' => 'completed'
                            ]);
                        } elseif ($paymentMethodType === 'ambos') {
                            $cashAmount = (float) $request->input('amount_cash', 0);
                            $qrAmount = (float) $request->input('amount_qr', 0);
                            
                            if ($cashAmount > 0 && $cashMethodId) {
                                \App\Models\Finance\Payment::create([
                                    'sale_id' => $sale->id,
                                    'payment_method_id' => $cashMethodId,
                                    'cash_register_id' => $cashRegisterId,
                                    'amount' => $cashAmount,
                                    'status' => 'completed'
                                ]);
                            }
                            if ($qrAmount > 0 && $qrMethodId) {
                                \App\Models\Finance\Payment::create([
                                    'sale_id' => $sale->id,
                                    'payment_method_id' => $qrMethodId,
                                    'cash_register_id' => $cashRegisterId,
                                    'amount' => $qrAmount,
                                    'status' => 'completed'
                                ]);
                            }
                        }
                    }
                }
                $sale->save();
                // ----------------------------------

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

                // Release stock reservations and refund stock
                $reservations = StockReservation::where('sale_id', $sale->id)->get();
                foreach ($reservations as $res) {
                    if ($res->status === 'released') continue;
                    
                    $inv = Inventory::where('branch_id', $res->branch_id)
                        ->where('variant_id', $res->variant_id)
                        ->lockForUpdate()
                        ->first();
                    
                    if ($inv) {
                        $stockBefore = $inv->stock;
                        $inv->stock += $res->quantity;
                        $inv->save();

                        InventoryMovement::create([
                            'variant_id' => $res->variant_id,
                            'branch_id' => $res->branch_id,
                            'movement_type' => 'return',
                            'quantity' => (int) $res->quantity,
                            'stock_before' => $stockBefore,
                            'stock_after' => $inv->stock,
                            'reference_type' => 'sale',
                            'reference_id' => $sale->id,
                            'created_by' => auth()->id() ?? null,
                        ]);
                    }
                    $res->update(['status' => 'released']);
                }
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
    /**
     * Update delivery schedule details (editable fields).
     */
    public function updateDeliveryDetails(Request $request, $id)
    {
        $request->validate([
            'meeting_point' => 'nullable|string',
            'scheduled_date' => 'nullable|date',
            'time_window' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'driver_id' => 'nullable|uuid|exists:employees,id',
            'guest_name' => 'nullable|string',
            'guest_phone' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $schedule = DeliverySchedule::with('shipment.sale')->findOrFail($id);

            // Don't allow editing if already on_the_way or beyond
            if (in_array($schedule->status, ['on_the_way', 'at_the_meeting_point', 'completed', 'cancelled'])) {
                return response()->json(['error' => 'No se puede editar una entrega en este estado.'], 400);
            }

            // Update schedule fields
            if ($request->has('meeting_point')) $schedule->meeting_point = $request->meeting_point;
            if ($request->has('scheduled_date')) $schedule->scheduled_date = $request->scheduled_date;
            if ($request->has('time_window')) $schedule->time_window = $request->time_window;
            if ($request->has('latitude')) $schedule->latitude = $request->latitude;
            if ($request->has('longitude')) $schedule->longitude = $request->longitude;
            if ($request->has('driver_id')) $schedule->driver_id = $request->driver_id;
            $schedule->save();

            // Update guest info if provided
            if ($request->has('guest_name') || $request->has('guest_phone')) {
                $sale = $schedule->shipment->sale;
                if ($sale && $sale->guest_id) {
                    $guest = Guest::find($sale->guest_id);
                    if ($guest) {
                        if ($request->has('guest_name')) $guest->name = $request->guest_name;
                        if ($request->has('guest_phone')) $guest->whatsapp_phone = $request->guest_phone;
                        $guest->save();
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Delivery details updated successfully.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Full update of an order-network delivery (items + logistics).
     */
    public function updateOrder(Request $request, $id)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|uuid|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.branch_id' => 'required|uuid|exists:branches,id',
            'meeting_point' => 'required|string',
            'scheduled_date' => 'required|date',
            'time_window' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'driver_id' => 'nullable|uuid|exists:employees,id',
            'guest_name' => 'nullable|string',
            'guest_phone' => 'nullable|string',
            'shipping_cost' => 'nullable|numeric|min:0'
        ]);

        try {
            DB::beginTransaction();

            $schedule = DeliverySchedule::with('shipment.sale')->findOrFail($id);

            if (in_array($schedule->status, ['on_the_way', 'at_the_meeting_point', 'completed', 'cancelled'])) {
                return response()->json(['error' => 'No se puede editar una entrega en este estado.'], 400);
            }

            $sale = $schedule->shipment->sale;

            // Refund old stock reservations
            $oldReservations = StockReservation::where('sale_id', $sale->id)->get();
            foreach ($oldReservations as $res) {
                $inv = Inventory::where('branch_id', $res->branch_id)
                    ->where('variant_id', $res->variant_id)
                    ->lockForUpdate()
                    ->first();
                
                if ($inv) {
                    $stockBefore = $inv->stock;
                    $inv->stock += $res->quantity;
                    $inv->save();

                    InventoryMovement::create([
                        'variant_id' => $res->variant_id,
                        'branch_id' => $res->branch_id,
                        'movement_type' => 'return',
                        'quantity' => (int) $res->quantity,
                        'stock_before' => $stockBefore,
                        'stock_after' => $inv->stock,
                        'reference_type' => 'sale',
                        'reference_id' => $sale->id,
                        'created_by' => auth()->id() ?? null,
                    ]);
                }
            }

            // Delete old sale details and stock reservations
            SaleDetail::where('sale_id', $sale->id)->delete();
            StockReservation::where('sale_id', $sale->id)->delete();

            // Recreate sale details and stock reservations
            $subtotal = 0;
            foreach ($request->items as $item) {
                $variant = \App\Models\Catalog\ProductVariant::findOrFail($item['variant_id']);
                $price = $variant->price ?? 0;
                $lineTotal = $price * $item['quantity'];
                $subtotal += $lineTotal;

                SaleDetail::create([
                    'sale_id' => $sale->id,
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $price,
                    'discount' => 0,
                    'discount_amount' => 0,
                    'final_price' => $price,
                    'subtotal' => $lineTotal
                ]);

                // Deduct new stock for reservation
                $inventory = Inventory::where('branch_id', $item['branch_id'])
                    ->where('variant_id', $item['variant_id'])
                    ->lockForUpdate()
                    ->first();

                if (!$inventory || $inventory->stock < $item['quantity']) {
                    throw new \Exception("Stock insuficiente para el producto.");
                }

                $stockBefore = $inventory->stock;
                $inventory->stock -= $item['quantity'];
                $inventory->save();

                InventoryMovement::create([
                    'variant_id' => $item['variant_id'],
                    'branch_id' => $item['branch_id'],
                    'movement_type' => 'sale',
                    'quantity' => (int) $item['quantity'],
                    'stock_before' => $stockBefore,
                    'stock_after' => $inventory->stock,
                    'reference_type' => 'delivery_schedule',
                    'reference_id' => $schedule->id,
                    'created_by' => auth()->id() ?? null,
                ]);

                StockReservation::create([
                    'variant_id' => $item['variant_id'],
                    'branch_id' => $item['branch_id'],
                    'sale_id' => $sale->id,
                    'quantity' => $item['quantity'],
                    'status' => 'reserved'
                ]);
            }

            $shippingCost = $request->input('shipping_cost', 0);
            $sale->subtotal = $subtotal;
            $sale->total = max(0, $subtotal + $shippingCost - ($sale->total_discount ?? 0));
            $sale->save();

            if ($schedule->shipment) {
                $schedule->shipment->shipping_cost = $shippingCost;
                $schedule->shipment->save();
            }

            // Update schedule
            $schedule->meeting_point = $request->meeting_point;
            $schedule->scheduled_date = $request->scheduled_date;
            $schedule->time_window = $request->time_window;
            $schedule->latitude = $request->latitude;
            $schedule->longitude = $request->longitude;
            $schedule->driver_id = $request->driver_id;
            $schedule->save();

            // Update guest
            if ($request->guest_name || $request->guest_phone) {
                if ($sale->guest_id) {
                    $guest = Guest::find($sale->guest_id);
                    if ($guest) {
                        if ($request->guest_name) $guest->name = $request->guest_name;
                        if ($request->guest_phone) $guest->whatsapp_phone = $request->guest_phone;
                        $guest->save();
                    }
                } else {
                    $guest = Guest::firstOrCreate(
                        ['whatsapp_phone' => $request->guest_phone],
                        ['name' => $request->guest_name]
                    );
                    $sale->guest_id = $guest->id;
                    $sale->save();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Entrega actualizada exitosamente.',
                'schedule_id' => $schedule->id,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('OrderNetwork Update Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove an item from the delivery and restore stock.
     */
    public function removeItem(Request $request, $id, $detailId)
    {
        try {
            DB::beginTransaction();

            $schedule = DeliverySchedule::with('shipment.sale.sale_details')->findOrFail($id);
            if (in_array($schedule->status, ['completed', 'cancelled'])) {
                return response()->json(['error' => 'No se puede quitar prendas en este estado.'], 400);
            }

            $sale = $schedule->shipment->sale;
            if ($sale->sale_details()->count() <= 1) {
                return response()->json(['error' => 'No puedes quitar la única prenda. Mejor cancela la entrega.'], 400);
            }

            $detail = $sale->sale_details()->findOrFail($detailId);

            // Restore stock
            $res = StockReservation::where('sale_id', $sale->id)->where('variant_id', $detail->variant_id)->first();
            if ($res && $res->status !== 'released') {
                $inv = Inventory::where('branch_id', $res->branch_id)
                    ->where('variant_id', $res->variant_id)
                    ->lockForUpdate()
                    ->first();
                
                if ($inv) {
                    $stockBefore = $inv->stock;
                    $inv->stock += $res->quantity;
                    $inv->save();

                    InventoryMovement::create([
                        'variant_id' => $res->variant_id,
                        'branch_id' => $res->branch_id,
                        'movement_type' => 'return',
                        'quantity' => (int) $res->quantity,
                        'stock_before' => $stockBefore,
                        'stock_after' => $inv->stock,
                        'reference_type' => 'sale',
                        'reference_id' => $sale->id,
                        'created_by' => auth()->id() ?? null,
                    ]);
                }
                $res->update(['status' => 'released']);
            }

            // Update Sale totals
            $sale->subtotal -= $detail->subtotal;
            $sale->total -= $detail->subtotal; // Subtotal and Total are generally the same before discount
            $sale->total_discount -= $detail->discount_amount;
            if ($sale->total < 0) $sale->total = 0;
            if ($sale->subtotal < 0) $sale->subtotal = 0;
            if ($sale->total_discount < 0) $sale->total_discount = 0;
            $sale->save();

            // Soft delete detail
            $detail->delete();

            DB::commit();

            return response()->json([
                'message' => 'Prenda quitada y devuelta al stock correctamente.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Restore a previously removed item to the delivery.
     */
    public function restoreItem(Request $request, $id, $detailId)
    {
        try {
            DB::beginTransaction();

            $schedule = DeliverySchedule::with(['shipment.sale.sale_details' => function($q) {
                $q->withTrashed();
            }])->findOrFail($id);

            if (in_array($schedule->status, ['completed', 'cancelled'])) {
                return response()->json(['error' => 'No se puede reintegrar prendas en este estado.'], 400);
            }

            $sale = $schedule->shipment->sale;
            $detail = $sale->sale_details()->withTrashed()->findOrFail($detailId);

            if (!$detail->trashed()) {
                return response()->json(['error' => 'La prenda no está eliminada.'], 400);
            }

            // Check stock and reserve again
            $res = StockReservation::where('sale_id', $sale->id)->where('variant_id', $detail->variant_id)->first();
            $branchId = $res ? $res->branch_id : env('MAIN_BRANCH_ID', 1);

            $inv = Inventory::where('branch_id', $branchId)
                ->where('variant_id', $detail->variant_id)
                ->lockForUpdate()
                ->first();

            if (!$inv || $inv->stock < $detail->quantity) {
                return response()->json(['error' => 'No hay stock suficiente para reintegrar esta prenda.'], 400);
            }

            $stockBefore = $inv->stock;
            $inv->stock -= $detail->quantity;
            $inv->save();

            InventoryMovement::create([
                'variant_id' => $detail->variant_id,
                'branch_id' => $branchId,
                'movement_type' => 'sale',
                'quantity' => (int) $detail->quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $inv->stock,
                'reference_type' => 'sale',
                'reference_id' => $sale->id,
                'created_by' => auth()->id() ?? null,
            ]);

            if ($res) {
                $res->update(['status' => 'reserved']);
            } else {
                StockReservation::create([
                    'variant_id' => $detail->variant_id,
                    'branch_id' => $branchId,
                    'sale_id' => $sale->id,
                    'quantity' => $detail->quantity,
                    'status' => 'reserved'
                ]);
            }

            // Update Sale totals
            $sale->subtotal += $detail->subtotal;
            $sale->total += $detail->subtotal; // Assuming total matches subtotal before global discounts
            $sale->total_discount += $detail->discount_amount;
            $sale->save();

            // Restore the soft-deleted detail
            $detail->restore();

            DB::commit();

            return response()->json([
                'message' => 'Prenda reintegrada a la entrega exitosamente.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}