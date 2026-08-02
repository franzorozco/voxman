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
use App\Models\Logistics\ShipmentCostDetail;
use App\Models\Logistics\ShipmentLocation;
use App\Models\Logistics\ShipmentTracking;
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
            'shipment.address',
            'shipment.sale.guest',
            'shipment.sale.customer.user.profile',
            'shipment.sale.customer.posProfile',
            'shipment.sale.sale_details.product_variant.product',
            'shipment.sale.sale_details.product_variant.inventories.branch',
            'shipment.sale.stock_reservations',
            'driver.user.profile'
        ])->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhereHas('shipment', function($q2) use ($search) {
                      $q2->where('tracking_code', 'like', "%{$search}%")
                         ->orWhere('delivery_code', 'like', "%{$search}%")
                         ->orWhereHas('sale', function($q3) use ($search) {
                             $q3->where('reference_number', 'like', "%{$search}%")
                                ->orWhere('invoice_number', 'like', "%{$search}%")
                                ->orWhereHas('guest', function($q4) use ($search) {
                                    $q4->where('name', 'like', "%{$search}%")
                                       ->orWhere('phone', 'like', "%{$search}%");
                                })
                                ->orWhereHas('customer', function($q4) use ($search) {
                                    $q4->where('customer_code', 'like', "%{$search}%")
                                       ->orWhereHas('posProfile', function($q5) use ($search) {
                                           $q5->where('first_name', 'like', "%{$search}%")
                                              ->orWhere('last_name_paternal', 'like', "%{$search}%")
                                              ->orWhere('phone', 'like', "%{$search}%");
                                       })
                                       ->orWhereHas('user.profile', function($q5) use ($search) {
                                           $q5->where('first_name', 'like', "%{$search}%")
                                              ->orWhere('last_name_paternal', 'like', "%{$search}%")
                                              ->orWhere('phone', 'like', "%{$search}%");
                                       });
                                });
                         });
                  })
                  ->orWhereHas('driver.user.profile', function($q2) use ($search) {
                      $q2->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name_paternal', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('delivery_type')) {
            $query->whereHas('shipment', function($q) use ($request) {
                $q->where('delivery_type', $request->delivery_type);
            });
        }

        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->driver_id);
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
     * Get historical destination cities for a customer or guest.
     */
    public function getDestinations(Request $request)
    {
        $customerId = $request->query('customer_id');
        $guestPhone = $request->query('guest_phone');
        
        $query = \App\Models\Logistics\Shipment::where('delivery_type', 'external');
        
        if ($customerId) {
            $query->whereHas('sale', function($q) use ($customerId) {
                $q->where('customer_id', $customerId);
            });
        } else if ($guestPhone) {
            $query->whereHas('sale.guest', function($q) use ($guestPhone) {
                $q->where('whatsapp_phone', 'like', "%$guestPhone%");
            });
        } else {
            return response()->json([]);
        }

        $shipments = $query->with('delivery_schedule')->get();
        $destinations = collect();

        foreach ($shipments as $shipment) {
            if (!empty($shipment->destination_city)) {
                $destinations->push($shipment->destination_city);
            } else if ($shipment->delivery_schedule && !empty($shipment->delivery_schedule->meeting_point)) {
                $destinations->push($shipment->delivery_schedule->meeting_point);
            }
        }

        return response()->json($destinations->unique()->values());
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
            'city' => 'nullable|string',
            'original_delivery_zone_id' => 'nullable|integer',
            'driver_id' => 'nullable|uuid|exists:employees,id',
            'save_as_draft' => 'nullable|boolean',
            'shipping_cost' => 'nullable|numeric|min:0',
            'delivery_type' => 'nullable|string|in:home_delivery,scheduled_point,pickup,external',
            'address_id' => 'nullable|uuid|exists:addresses,id',
            'recipient_name' => 'nullable|string|max:150',
            'recipient_ci' => 'nullable|string|max:50',
            'recipient_phone' => 'nullable|string|max:50',
            'destination_city' => 'nullable|string|max:150'
        ]);

        try {
            DB::beginTransaction();

            $cart = Cart::with('items.product_variant')->findOrFail($request->cart_id);

            // Handle Guest or Customer
            $guestId = null;
            $customerId = $request->customer_id;

            if (!$customerId && $request->guest_name) {
                $phone = trim($request->guest_phone);
                
                if (!empty($phone)) {
                    $guest = Guest::firstOrCreate(
                        ['whatsapp_phone' => $phone],
                        ['name' => $request->guest_name]
                    );
                    
                    if ($guest->name !== $request->guest_name) {
                        $guest->update(['name' => $request->guest_name]);
                    }
                } else {
                    $guest = Guest::create([
                        'name' => $request->guest_name,
                        'whatsapp_phone' => null
                    ]);
                }
                
                $guestId = $guest->id;
            }

            // Create Sale
            $sale = Sale::create([
                'customer_id' => $customerId,
                'guest_id' => $guestId,
                'branch_id' => null,
                'user_id' => auth()->id() ?? null,
                'invoice_number' => 'DLV-' . strtoupper(\Illuminate\Support\Str::random(6)),
                'sale_type' => 'delivery',
                'status' => 'pending',
                'source' => 'order_network',
                'subtotal' => 0, // Will calculate below
                'discount_total' => $cart->total_discount ?? 0,
                'discount_id' => $cart->discount_id ?? null,
                'total' => 0,
                'notes' => null
            ]);

            $subtotal = 0;
            $itemsForDiscount = [];

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
                $inventory = \App\Models\Inventory\Inventory::where('branch_id', $reserveBranchId)
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
                \App\Models\Inventory\StockReservation::create([
                    'variant_id' => $item->variant_id,
                    'branch_id' => $reserveBranchId,
                    'sale_id' => $sale->id,
                    'quantity' => $item->quantity,
                    'status' => 'reserved'
                ]);
            }

            // Update sale totals
            $shippingCost = (float)$request->input('shipping_cost', 0);
            $agencyDispatchCost = (float)$request->input('agency_dispatch_cost', 0);
            $sale->subtotal = $subtotal;
            $sale->total = max(0, $subtotal + $shippingCost + $agencyDispatchCost - ($sale->discount_total ?? 0));
            $sale->save();

            // Create Shipment
            $shipment = Shipment::create([
                'sale_id' => $sale->id,
                'status' => 'pending',
                'shipping_cost' => $shippingCost,
                'agency_dispatch_cost' => $request->input('agency_dispatch_cost', null),
                'delivery_code' => str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT),
                'delivery_type' => $request->input('delivery_type', 'scheduled_point'),
                'address_id' => $request->input('address_id', null),
                'recipient_name' => $request->input('recipient_name', null),
                'recipient_ci' => $request->input('recipient_ci', null),
                'recipient_phone' => $request->input('recipient_phone', null),
                'destination_city' => $request->input('destination_city', null)
            ]);

            // Create Delivery Schedule
            $schedule = DeliverySchedule::create([
                'shipment_id' => $shipment->id,
                'scheduled_date' => $request->scheduled_date,
                'time_window' => $request->time_window,
                'meeting_point' => $request->meeting_point,
                'city' => $request->city,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'original_delivery_zone_id' => $request->original_delivery_zone_id,
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
            'shipment.address',
            'shipment.sale.sale_details' => function($q) { 
                $q->withTrashed()->with([
                    'product_variant.product.product_images', 
                    'product_variant.product.attribute_value_images',
                    'product_variant.variant_images',
                    'product_variant.size',
                    'product_variant.fit',
                    'product_variant.variant_attribute_values.attribute_value.attribute',
                    'product_variant.inventories.branch'
                ]); 
            },
            'shipment.sale.guest', 
            'shipment.sale.customer.user.profile',
            'shipment.sale.customer.posProfile',
            'shipment.sale.discount',
            'shipment.sale.payments.payment_method',
            'shipment.sale.giftcard_transactions.giftcard',
            'shipment.sale.stockReservations.branch',
            'driver.user.profile',
            'shipment.tracking_history'
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
            return response()->json(['error' => 'Solo se pueden confirmar entregas en estado pendiente.'], 400);
        }

        $schedule->status = 'confirmed';
        $schedule->save();

        return response()->json([
            'message' => 'Horario confirmado exitosamente.',
            'schedule' => $schedule
        ]);
    }

    /**
     * Customer updates delivery notes from the public link.
     */
    public function updateNotes(Request $request, $id)
    {
        $request->validate([
            'notes' => 'nullable|string'
        ]);

        $schedule = DeliverySchedule::with('shipment')->findOrFail($id);
        
        if (!$schedule->shipment) {
            return response()->json(['error' => 'Entrega no encontrada.'], 404);
        }

        $schedule->shipment->notes = $request->notes;
        $schedule->shipment->save();

        event(new \App\Events\DeliveryNotesUpdated($id, $schedule->shipment->notes));

        return response()->json([
            'message' => 'Notas guardadas exitosamente.',
            'notes' => $schedule->shipment->notes
        ]);
    }

    /**
     * Update delivery status (Driver/Admin endpoint).
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:on_the_way,at_the_meeting_point,completed,cancelled,prepared,packaged,shipped'
        ]);

        try {
            DB::beginTransaction();

            $schedule = DeliverySchedule::with('shipment.sale')->findOrFail($id);
            $schedule->status = $request->status;
            $schedule->save();

            // Track the status change
            if ($schedule->shipment) {
                $description = 'El estado de la entrega cambió a ' . $request->status;
                if ($request->status === 'prepared') $description = 'Pedido preparado y listo para empaque.';
                if ($request->status === 'packaged') $description = 'Pedido empaquetado y listo para envío.';
                if ($request->status === 'shipped') {
                    $company = $request->input('external_company', 'Agencia');
                    $guide = $request->input('external_guide', 'S/N');
                    $description = "Pedido remitido a la transportadora {$company} (Guía: {$guide}).";
                }
                if ($request->status === 'completed') $description = 'Pedido entregado exitosamente al cliente.';
                if ($request->status === 'on_the_way') $description = 'El pedido está en camino.';
                if ($request->status === 'at_the_meeting_point') $description = 'El repartidor llegó al punto de encuentro.';
                
                \App\Models\Logistics\ShipmentTracking::create([
                    'shipment_id' => $schedule->shipment->id,
                    'status' => $request->status,
                    'description' => $description
                ]);
            }
if ($request->status === 'shipped') {
                $shipment = $schedule->shipment;
                $shipment->status = 'shipped';
                $shipment->shipped_at = now();
                if ($request->has('external_company')) $shipment->external_company = $request->input('external_company');
                if ($request->has('external_guide')) $shipment->external_guide = $request->input('external_guide');
                if ($request->has('shipping_payment_type')) {
                    $shipment->shipping_payment_type = $request->input('shipping_payment_type');
                }
                if ($request->has('notes')) {
                    $shipment->notes = $request->input('notes');
                    event(new \App\Events\DeliveryNotesUpdated($schedule->id, $shipment->notes));
                }
                
                $shippingCost = (float) $request->input('shipping_cost', 0);
                $shipment->shipping_cost = $shippingCost;
                
                // If it is "paid", add it to the sale total
                if ($request->input('shipping_payment_type') === 'paid' && $shippingCost > 0) {
                    $sale = $shipment->sale;
                    if ($sale) {
                        $sale->total += $shippingCost;
                        $sale->save();
                    }
                }

                $shipment->save();

                // Populate shipment_cost_details
                if ($request->filled('shipping_cost')) {
                    \App\Models\Logistics\ShipmentCostDetail::updateOrCreate(
                        ['shipment_id' => $shipment->id],
                        [
                            'base_cost' => $request->input('shipping_cost'),
                            'distance_cost' => 0,
                            'extra_cost' => 0,
                            'total' => $request->input('shipping_cost')
                        ]
                    );
                }

                // Populate shipment_locations using the branch coordinates of the shipment's origin (sale->branch)
                $branch = $schedule->shipment->sale->branch ?? null;
                if ($branch && $branch->latitude && $branch->longitude) {
                    \Illuminate\Support\Facades\DB::table('shipment_locations')->insert([
                        'shipment_id' => $shipment->id,
                        'latitude' => $branch->latitude,
                        'longitude' => $branch->longitude,
                        'created_at' => now()
                    ]);
                }
            }

            if ($request->status === 'completed') {
                $shipment = $schedule->shipment;
                $shipment->status = 'delivered';
                $shipment->delivered_at = now();
                $shipment->save();
            }

            $shipment = $schedule->shipment;
            $isExternal = $shipment->delivery_type === 'external';
            $isPaymentStage = ($request->status === 'completed' && !$isExternal) || 
                              ($request->status === 'prepared' && $isExternal);

            if ($isPaymentStage) {
                $sale = $shipment->sale;
                
                // --- PAYMENT AND DISCOUNT LOGIC ---
                $amountPaid = $request->input('monto_real');
                if ($amountPaid !== null && $sale->status !== 'paid') {
                    $sale->status = 'paid';
                    
                    $amountPaid = (float) $amountPaid;
                    $discountDiff = max(0, $sale->total - $amountPaid);

                    $appliedCode = $request->input('applied_code');
                    if ($appliedCode) {
                        $discountService = app(\App\Services\Finance\DiscountValidationService::class);
                        $validationResult = $discountService->validateCode(
                            $appliedCode,
                            $sale->total,
                            $sale->sale_details()->whereNull('deleted_at')->get(),
                            $sale->customer_id,
                            $sale->branch_id
                        );

                        if ($validationResult['valid']) {
                            if ($validationResult['type'] === 'giftcard') {
                                $giftcard = \App\Models\Finance\Giftcard::find($validationResult['id']);
                                if ($giftcard) {
                                    $giftcard->current_balance -= $validationResult['discount_amount'];
                                    $giftcard->save();

                                    \App\Models\Finance\GiftcardTransaction::create([
                                        'id' => \Illuminate\Support\Str::uuid(),
                                        'giftcard_id' => $giftcard->id,
                                        'type' => 'use',
                                        'amount' => $validationResult['discount_amount'],
                                        'notes' => 'Usado en pago de entrega (Venta: ' . $sale->id . ')'
                                    ]);
                                }
                            } elseif ($validationResult['type'] === 'discount') {
                                $discount = \App\Models\Discount\Discount::find($validationResult['id']);
                                if ($discount) {
                                    $discount->used_count += 1;
                                    $discount->save();
                                    $sale->discount_id = $discount->id;
                                }
                            }
                        }
                    }

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
                    
                    $sale->save();
                    // ----------------------------------
                    
                    // Confirm stock reservations
                    \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)
                        ->update(['status' => 'confirmed']);
                }
            }

            if ($request->status === 'cancelled') {
                $shipment = $schedule->shipment;
                $shipment->status = 'cancelled';
                $shipment->save();

                $sale = $shipment->sale;
                $sale->status = 'cancelled';
                $sale->save();

                // Release stock reservations and refund stock
                $reservations = \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)->get();
                foreach ($reservations as $res) {
                    if ($res->status === 'released') continue;
                    
                    $inv = \App\Models\Inventory\Inventory::where('branch_id', $res->branch_id)
                        ->where('variant_id', $res->variant_id)
                        ->lockForUpdate()
                        ->first();
                    
                    if ($inv) {
                        $stockBefore = $inv->stock;
                        $inv->stock += $res->quantity;
                        $inv->save();

                        \App\Models\Inventory\InventoryMovement::create([
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

            try {
                event(new \App\Events\DeliveryStatusUpdated($schedule->id, $schedule->status, $schedule->shipment->delivery_code ?? null));
            } catch (\Throwable $eventError) {
                \Log::warning("DeliveryStatusUpdated Event failed to broadcast: " . $eventError->getMessage());
            }
            DB::commit();

            return response()->json([
                'message' => 'Delivery status updated successfully.',
                'status' => $schedule->status
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error("UpdateStatus Error: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . "\n" . $e->getTraceAsString());
            return response()->json(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()], 500);
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
            'notes' => 'nullable|string',
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
            
            if ($request->has('notes')) {
                $schedule->shipment->notes = $request->notes;
                $schedule->shipment->save();
                event(new \App\Events\DeliveryNotesUpdated($schedule->id, $schedule->shipment->notes));
            }

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
            'shipping_cost' => 'nullable|numeric|min:0',
            'delivery_type' => 'nullable|string|in:home_delivery,scheduled_point,pickup,external',
            'address_id' => 'nullable|uuid|exists:addresses,id',
            'recipient_name' => 'nullable|string|max:150',
            'recipient_ci' => 'nullable|string|max:50',
            'recipient_phone' => 'nullable|string|max:50',
            'destination_city' => 'nullable|string|max:150'
        ]);

        try {
            DB::beginTransaction();

            $schedule = DeliverySchedule::with('shipment.sale')->findOrFail($id);

            if (in_array($schedule->status, ['on_the_way', 'at_the_meeting_point', 'completed', 'cancelled'])) {
                return response()->json(['error' => 'No se puede editar una entrega en este estado.'], 400);
            }

            $sale = $schedule->shipment->sale;

            // Refund old stock reservations
            $oldReservations = \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)->get();
            foreach ($oldReservations as $res) {
                $inv = \App\Models\Inventory\Inventory::where('branch_id', $res->branch_id)
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

            // Delete old stock reservations, we will recreate them
            \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)->delete();

            $newVariantIds = collect($request->items)->pluck('variant_id')->toArray();
            
            // Soft delete details that were removed
            SaleDetail::where('sale_id', $sale->id)->whereNotIn('variant_id', $newVariantIds)->delete();

            // Recreate or update sale details and recreate stock reservations
            $subtotal = 0;
            foreach ($request->items as $item) {
                $variant = \App\Models\Catalog\ProductVariant::findOrFail($item['variant_id']);
                $price = $variant->price ?? 0;
                $lineTotal = $price * $item['quantity'];
                $subtotal += $lineTotal;

                $detail = SaleDetail::withTrashed()->where('sale_id', $sale->id)->where('variant_id', $item['variant_id'])->first();
                if ($detail) {
                    $detail->update([
                        'quantity' => $item['quantity'],
                        'unit_price' => $price,
                        'final_price' => $price,
                        'subtotal' => $lineTotal,
                        'deleted_at' => null
                    ]);
                } else {
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
                }

                // Deduct new stock for reservation
                $inventory = \App\Models\Inventory\Inventory::where('branch_id', $item['branch_id'])
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

                \App\Models\Inventory\StockReservation::create([
                    'variant_id' => $item['variant_id'],
                    'branch_id' => $item['branch_id'],
                    'sale_id' => $sale->id,
                    'quantity' => $item['quantity'],
                    'status' => 'reserved'
                ]);
            }

            $shippingCost = (float)$request->input('shipping_cost', 0);
            $agencyDispatchCost = (float)$request->input('agency_dispatch_cost', 0);
            $sale->subtotal = $subtotal;
            $sale->total = max(0, $subtotal + $shippingCost + $agencyDispatchCost - ($sale->discount_total ?? 0));
            $sale->save();

            if ($schedule->shipment) {
                $schedule->shipment->shipping_cost = $shippingCost;
                if ($request->has('agency_dispatch_cost')) {
                    $schedule->shipment->agency_dispatch_cost = $request->input('agency_dispatch_cost');
                }
                if ($request->has('delivery_type')) {
                    $schedule->shipment->delivery_type = $request->delivery_type;
                }
                if ($request->has('address_id')) {
                    $schedule->shipment->address_id = $request->address_id;
                }
                if ($request->has('recipient_name')) {
                    $schedule->shipment->recipient_name = $request->recipient_name;
                }
                if ($request->has('recipient_ci')) {
                    $schedule->shipment->recipient_ci = $request->recipient_ci;
                }
                if ($request->has('recipient_phone')) {
                    $schedule->shipment->recipient_phone = $request->recipient_phone;
                }
                if ($request->has('destination_city')) {
                    $schedule->shipment->destination_city = $request->destination_city;
                }
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
     * Add an item to the delivery.
     */
    public function addItem(Request $request, $id)
    {
        $request->validate([
            'variant_id' => 'required|uuid'
        ]);

        try {
            DB::beginTransaction();
            $schedule = DeliverySchedule::with('shipment.sale.sale_details')->findOrFail($id);

            if ($schedule->status !== 'at_the_meeting_point') {
                return response()->json(['error' => 'Solo puedes agregar prendas cuando el pedido está en el punto de encuentro.'], 400);
            }

            $sale = $schedule->shipment->sale;
            $variant = \App\Models\Catalog\ProductVariant::with('product')->findOrFail($request->variant_id);

            // Determine branch_id: from request, from existing StockReservation, or default
            $branchId = $request->branch_id;
            if (!$branchId) {
                $existingRes = \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)->first();
                $branchId = $existingRes ? $existingRes->branch_id : env('MAIN_BRANCH_ID', 1);
            }

            // Check inventory
            $inv = \App\Models\Inventory\Inventory::where('branch_id', $branchId)
                ->where('variant_id', $variant->id)
                ->lockForUpdate()
                ->first();

            if (!$inv || $inv->stock < 1) {
                return response()->json(['error' => 'No hay stock suficiente para agregar esta prenda.'], 400);
            }

            // Deduct stock
            $stockBefore = $inv->stock;
            $inv->stock -= 1;
            $inv->save();

            InventoryMovement::create([
                'variant_id' => $variant->id,
                'branch_id' => $branchId,
                'movement_type' => 'sale',
                'quantity' => 1,
                'stock_before' => $stockBefore,
                'stock_after' => $inv->stock,
                'reference_type' => 'sale',
                'reference_id' => $sale->id,
                'created_by' => auth()->id() ?? null,
            ]);

            // Revival logic: check if there's an existing released reservation for this variant & branch
            $res = \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)
                ->where('variant_id', $variant->id)
                ->where('branch_id', $branchId)
                ->first();

            if ($res) {
                if ($res->status === 'released') {
                    $res->update(['status' => 'confirmed', 'quantity' => 1]);
                } else {
                    $res->increment('quantity');
                }
            } else {
                \App\Models\Inventory\StockReservation::create([
                    'sale_id' => $sale->id,
                    'variant_id' => $variant->id,
                    'branch_id' => $branchId,
                    'quantity' => 1,
                    'status' => 'confirmed'
                ]);
            }

            $price = $variant->price ?? $variant->product->base_price ?? 0;

            // Check if there is an existing SaleDetail for this variant
            $detail = $sale->sale_details()->where('variant_id', $variant->id)->first();
            if ($detail) {
                $detail->quantity += 1;
                $detail->subtotal += $price;
                $detail->final_price += $price;
                $detail->save();
            } else {
                $sale->sale_details()->create([
                    'variant_id' => $variant->id,
                    'quantity' => 1,
                    'unit_price' => $price,
                    'subtotal' => $price,
                    'final_price' => $price,
                    'discount_amount' => 0,
                    'notes' => 'Agregado en el punto de entrega'
                ]);
            }

            // Update Sale totals
            $sale->subtotal += $price;
            $sale->total += $price;
            $sale->save();

            if ($schedule->checkout_session) {
                $session = $schedule->checkout_session;
                $session['monto_real'] = $sale->total;
                $schedule->checkout_session = $session;
                $schedule->save();
            }

            event(new \App\Events\DeliveryStatusUpdated($schedule->id, $schedule->status, $schedule->shipment->delivery_code ?? null));

            DB::commit();

            return response()->json([
                'message' => 'Prenda agregada correctamente al pedido.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove an item from the delivery and restore stock.
     */
    public function removeItem(Request $request, $id, $reservationId)
    {
        try {
            DB::beginTransaction();

            $schedule = DeliverySchedule::with('shipment.sale.sale_details')->findOrFail($id);
            if (in_array($schedule->status, ['completed', 'cancelled'])) {
                return response()->json(['error' => 'No se puede quitar prendas en este estado.'], 400);
            }

            $sale = $schedule->shipment->sale;
            $res = \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)->find($reservationId);
            
            // Fallback: If the frontend passed a SaleDetail ID because the StockReservation wasn't available in the UI state
            if (!$res) {
                $detailFallback = $sale->sale_details()->find($reservationId);
                if ($detailFallback) {
                    $res = \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)->where('variant_id', $detailFallback->variant_id)->first();
                }
            }

            if (!$res) {
                return response()->json(['error' => 'Reserva de stock no encontrada.'], 404);
            }
            
            $detail = $sale->sale_details()->where('variant_id', $res->variant_id)->first();
            if (!$detail) {
                return response()->json(['error' => 'Detalle de venta no encontrado.'], 404);
            }

            // Check if it's the ONLY active item left
            $totalActiveQty = \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)->whereIn('status', ['reserved', 'confirmed'])->sum('quantity');
            if ($totalActiveQty <= 1) {
                return response()->json(['error' => 'No puedes quitar la única prenda de la entrega. Si el cliente no desea nada, cancela la entrega completa.'], 400);
            }

            $branchId = $res->branch_id;
            if (!$branchId) {
                $branchId = $schedule->shipment->origin_branch_id ?? $sale->branch_id;
                if (!$branchId) {
                    $branchId = \App\Models\Company\Branch::where('is_active', true)->first()->id ?? null;
                }
            }

            // Restore stock (1 unit)
            if ($res->status !== 'released') {
                $inv = \App\Models\Inventory\Inventory::where('branch_id', $branchId)
                    ->where('variant_id', $res->variant_id)
                    ->lockForUpdate()
                    ->first();
                
                if ($inv) {
                    $stockBefore = $inv->stock;
                    $inv->stock += 1; // Return 1 unit
                    $inv->save();

                    InventoryMovement::create([
                        'variant_id' => $res->variant_id,
                        'branch_id' => $res->branch_id,
                        'movement_type' => 'return',
                        'quantity' => 1, // 1 unit
                        'stock_before' => $stockBefore,
                        'stock_after' => $inv->stock,
                        'reference_type' => 'sale',
                        'reference_id' => $sale->id,
                        'created_by' => auth()->id() ?? null,
                    ]);
                }
                
                if ($res->quantity > 1) {
                    $res->quantity -= 1;
                    $res->save();
                } else {
                    $res->update(['status' => 'released']);
                }
            }

            // Decrement SaleDetail or Delete if it was the last unit
            if ($detail->quantity > 1) {
                $detail->quantity -= 1;
                $detail->subtotal -= $detail->unit_price;
                $detail->final_price -= $detail->unit_price;
                $detail->save();
            } else {
                $detail->delete();
            }

            // Update Sale totals
            $sale->subtotal -= $detail->unit_price;
            $sale->total -= $detail->unit_price; 
            if ($sale->total < 0) $sale->total = 0;
            if ($sale->subtotal < 0) $sale->subtotal = 0;
            $sale->save();

            if ($schedule->checkout_session) {
                $session = $schedule->checkout_session;
                $session['monto_real'] = $sale->total;
                $schedule->checkout_session = $session;
                $schedule->save();
            }

            event(new \App\Events\DeliveryStatusUpdated($schedule->id, $schedule->status, $schedule->shipment->delivery_code ?? null));

            DB::commit();

            return response()->json([
                'message' => 'Prenda quitada y stock devuelto exitosamente.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Restore a previously removed item to the delivery.
     */
    public function restoreItem(Request $request, $id, $reservationId)
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
            $res = \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)->find($reservationId);

            // Fallback: If the frontend passed a SaleDetail ID because the StockReservation wasn't available in the UI state
            if (!$res) {
                $detailFallback = $sale->sale_details()->withTrashed()->find($reservationId);
                if ($detailFallback) {
                    $res = \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)->where('variant_id', $detailFallback->variant_id)->first();
                }
            }

            if (!$res) {
                return response()->json(['error' => 'Reserva de stock no encontrada.'], 404);
            }
            
            $detail = $sale->sale_details()->withTrashed()->where('variant_id', $res->variant_id)->first();

            if (!$detail || !$detail->trashed()) {
                return response()->json(['error' => 'La prenda no está eliminada.'], 400);
            }

            $branchId = $res->branch_id;
            if (!$branchId) {
                $branchId = $schedule->shipment->origin_branch_id ?? $sale->branch_id;
                if (!$branchId) {
                    $branchId = \App\Models\Company\Branch::where('is_active', true)->first()->id ?? null;
                }
                $res->branch_id = $branchId;
            }

            $inv = \App\Models\Inventory\Inventory::where('branch_id', $branchId)
                ->where('variant_id', $detail->variant_id)
                ->lockForUpdate()
                ->first();

            if (!$inv || $inv->stock < 1) { // Restoring 1 unit
                return response()->json(['error' => 'No hay stock suficiente para reintegrar esta prenda.'], 400);
            }

            $stockBefore = $inv->stock;
            $inv->stock -= 1; // 1 unit
            $inv->save();

            \App\Models\Inventory\InventoryMovement::create([
                'variant_id' => $detail->variant_id,
                'branch_id' => $branchId,
                'movement_type' => 'sale',
                'quantity' => 1,
                'stock_before' => $stockBefore,
                'stock_after' => $inv->stock,
                'reference_type' => 'sale',
                'reference_id' => $sale->id,
                'created_by' => auth()->id() ?? null,
            ]);

            $res->update(['status' => 'reserved']); // It was released, quantity is 1

            // Update Sale totals
            $sale->subtotal += $detail->unit_price;
            $sale->total += $detail->unit_price;
            $sale->save();

            if ($schedule->checkout_session) {
                $session = $schedule->checkout_session;
                $session['monto_real'] = $sale->total;
                $schedule->checkout_session = $session;
                $schedule->save();
            }

            // Restore the soft-deleted detail
            $detail->restore();

            event(new \App\Events\DeliveryStatusUpdated($schedule->id, $schedule->status, $schedule->shipment->delivery_code ?? null));

            DB::commit();

            return response()->json([
                'message' => 'Prenda reintegrada a la entrega exitosamente.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function shareCheckoutSession(Request $request, $id)
    {
        $request->validate([
            'payment_method' => 'required|string',
            'monto_real' => 'required|numeric',
            'cash_amount' => 'nullable|numeric',
            'qr_amount' => 'nullable|numeric',
            'sale_total' => 'nullable|numeric'
        ]);

        $schedule = DeliverySchedule::findOrFail($id);
        
        $schedule->checkout_session = $request->all();
        $schedule->save();

        event(new \App\Events\CheckoutSessionShared($id, $request->all()));

        return response()->json(['message' => 'Sesión de cobro compartida exitosamente.']);
    }

    public function applyDiscount(Request $request, $id, \App\Services\Finance\DiscountValidationService $discountService)
    {
        $request->validate([
            'code' => 'required|string'
        ]);

        $schedule = DeliverySchedule::with(['shipment.sale.sale_details'])->findOrFail($id);
        $sale = $schedule->shipment->sale;

        if (!$sale) {
            return response()->json(['error' => 'No se encontró la venta asociada a esta entrega.'], 404);
        }

        // Rule: Solo uno (Only one discount/giftcard per sale)
        if ($sale->discount_id || $sale->giftcard_id) {
            return response()->json(['error' => 'Esta venta ya tiene un descuento o giftcard aplicado.'], 400);
        }

        $code = trim($request->code);

        // Build items for validation service
        $items = $sale->sale_details->map(function($detail) {
            return [
                'variant_id' => $detail->variant_id,
                'line_subtotal' => $detail->subtotal
            ];
        })->toArray();

        // Validate using the shared service
        $result = $discountService->validateCode(
            $code,
            $sale->subtotal,
            $items,
            $sale->customer_id,
            $sale->branch_id
        );

        if (!$result['valid']) {
            return response()->json(['error' => $result['message']], 400);
        }

        $discountAmount = $result['discount_amount'];
        $discountData = [
            'type' => $result['type'],
            'code' => $code,
            'amount' => $discountAmount
        ];

        if ($result['type'] === 'giftcard') {
            $sale->giftcard_id = $result['id'];
        } else {
            $sale->discount_id = $result['id'];
        }

        $sale->discount_total += $discountAmount;
        $sale->total = max(0, $sale->total - $discountAmount);
        $sale->save();

        if ($schedule->checkout_session) {
            $session = $schedule->checkout_session;
            $session['monto_real'] = $sale->total;
            $schedule->checkout_session = $session;
            $schedule->save();
        }

        // Broadcast back to admin
        event(new \App\Events\DeliveryDiscountApplied($id, $sale, $discountData));

        return response()->json([
            'message' => 'Descuento aplicado correctamente',
            'discount_amount' => $discountAmount,
            'new_total' => $sale->total
        ]);
    }

    public function removeDiscount($id)
    {
        $schedule = DeliverySchedule::with('shipment.sale')->findOrFail($id);
        $sale = $schedule->shipment->sale;

        if (!$sale || (!$sale->discount_id && !$sale->giftcard_id)) {
            return response()->json(['error' => 'No hay descuento para quitar.'], 400);
        }

        // Revert total
        $sale->total += $sale->discount_total;
        $sale->discount_total = 0;
        $sale->discount_id = null;
        $sale->giftcard_id = null;
        $sale->save();

        if ($schedule->checkout_session) {
            $session = $schedule->checkout_session;
            $session['monto_real'] = $sale->total;
            $schedule->checkout_session = $session;
            $schedule->save();
        }

        // Broadcast to clients
        event(new \App\Events\DeliveryDiscountRemoved($id, $sale));

        return response()->json([
            'message' => 'Descuento eliminado correctamente',
            'new_total' => $sale->total
        ]);
    }
    public function toggleRecipientEdit(Request $request, $id)
    {
        $schedule = DeliverySchedule::with('shipment')->findOrFail($id);
        
        if (!$schedule->shipment) {
            return response()->json(['error' => 'No se encontró el envío.'], 404);
        }

        $session = $schedule->shipment->recipient_edit_session ?: [];
        $session['is_shared'] = $request->boolean('is_shared');
        $session['shared_at'] = now()->toIso8601String();

        $schedule->shipment->update([
            'recipient_edit_session' => $session
        ]);

        // Broadcast a websocket event if we want the tracking page to update in real time
        // Alternatively, the tracking page just reloads.
        event(new \App\Events\DeliveryUpdated($schedule->id, 'recipient_edit_toggled'));

        return response()->json([
            'message' => $session['is_shared'] ? 'Edición compartida habilitada' : 'Edición deshabilitada',
            'shipment' => $schedule->shipment
        ]);
    }

    public function updateRecipientInfo(Request $request, $id)
    {
        $schedule = DeliverySchedule::with('shipment')->findOrFail($id);
        
        if (!$schedule->shipment) {
            return response()->json(['error' => 'No se encontró el envío.'], 404);
        }

        $session = $schedule->shipment->recipient_edit_session;
        if (empty($session) || empty($session['is_shared'])) {
            return response()->json(['error' => 'La edición no está habilitada para este envío.'], 403);
        }

        $request->validate([
            'recipient_name' => 'nullable|string|max:255',
            'recipient_ci' => 'nullable|string|max:50',
            'recipient_phone' => 'nullable|string|max:50',
            'destination_city' => 'nullable|string|max:100',
        ]);

        $schedule->shipment->update([
            'recipient_name' => $request->recipient_name,
            'recipient_ci' => $request->recipient_ci,
            'recipient_phone' => $request->recipient_phone,
            'destination_city' => $request->destination_city,
        ]);

        // Disable edit session automatically after save if desired, or keep it open.
        // The prompt says: "si le doy a 'dejar de compartir' entonces el modo de edicion ya no esta accsible". 
        // It implies the admin controls when to stop sharing. So we leave it open.

        // Broadcast so admin dashboard updates
        event(new \App\Events\DeliveryUpdated($schedule->id, 'recipient_info_updated'));

        return response()->json([
            'message' => 'Información actualizada correctamente',
            'shipment' => $schedule->shipment
        ]);
    }
}
