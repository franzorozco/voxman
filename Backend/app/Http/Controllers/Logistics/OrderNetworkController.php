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
            'shipment.pickupBranch.address',
            'shipment.sale.guest',
            'shipment.sale.customer.user.profile',
            'shipment.sale.customer.posProfile',
            'shipment.sale.sale_details' => function($q) {
                $q->withTrashed()->with([
                    'product_variant.product.product_images',
                    'product_variant.product.attribute_value_images',
                    'product_variant.size',
                    'product_variant.fit',
                    'product_variant.variant_attribute_values.attribute_value.attribute',
                    'product_variant.variant_images',
                    'product_variant.inventories.branch', 'sale_applied_discount',
                    'return_request'
                ]);
            },
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
    public function getDrivers(\Illuminate\Http\Request $request)
    {
        $query = \App\Models\Actors\Employee::with('user.profile')->where('is_active', true);
        
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($qBuilder) use ($search) {
                $qBuilder->whereHas('user.profile', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name_paternal', 'like', "%{$search}%")
                      ->orWhere('last_name_maternal', 'like', "%{$search}%");
                })->orWhere('employee_code', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }
        
        $employees = $query->get();
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
            'pickup_branch_id' => 'nullable|uuid|exists:branches,id',
            'address_id' => 'nullable|uuid|exists:addresses,id',
            'recipient_name' => 'nullable|string|max:150',
            'recipient_ci' => 'nullable|string|max:50',
            'recipient_phone' => 'nullable|string|max:50',
            'destination_city' => 'nullable|string|max:150'
        ]);

        try {
            if ($request->has('delivery_type')) {
                $typeMap = [
                    'home_delivery' => 'delivery_home',
                    'scheduled_point' => 'delivery_scheduled_point',
                    'pickup' => 'delivery_pickup',
                    'external' => 'delivery_national'
                ];
                $settingKey = $typeMap[$request->delivery_type] ?? null;
                if ($settingKey) {
                    $isActive = \App\Models\System\SystemSetting::where('key', $settingKey)->value('value');
                    if ($isActive === 'false') {
                        return response()->json(['error' => 'El método de entrega seleccionado no está disponible en este momento.'], 400);
                    }
                }
            }

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
                'subtotal' => collect($cart->items)->sum('dynamic_subtotal'),
                'discount_total' => $cart->dynamic_global_discount,
                'total' => $cart->total_amount,
                'notes' => null
            ]);

            // Insert global cart discount ONE time
            if ($cart->discount_id && $cart->dynamic_global_discount > 0) {
                \App\Models\Sales\SaleAppliedDiscount::create([
                    'sale_id'         => $sale->id,
                    'sale_detail_id'  => null,
                    'discount_id'     => $cart->discount_id,
                    'discount_amount' => $cart->dynamic_global_discount,
                ]);
            }

            $itemsBranches = collect($request->input('items_branches', []))->keyBy('variant_id');

            foreach ($cart->items as $index => $item) {
                $price = $item->dynamic_unit_price;
                $lineTotalBeforeGlobal = $item->dynamic_subtotal;
                $originalPrice = $item->variant ? $item->variant->price : ($item->original_price ?? $price);
                
                // Create Sale Detail (stores native price, not global discount)
                $detail = SaleDetail::create([
                    'sale_id'         => $sale->id,
                    'variant_id'      => $item->variant_id,
                    'quantity'        => $item->quantity,
                    'unit_price'      => $price,
                    'discount'        => 0, // native discount only, global goes to sale_sale_applied_discounts
                    'final_price'     => $price,
                    'subtotal'        => $lineTotalBeforeGlobal,
                    'original_price'  => $originalPrice,
                    'bundle_price'    => $item->bundle_group_id ? $price : null,
                    'bundle_group_id' => $item->bundle_group_id,
                ]);

                // Insert item-level native discount to applied discounts
                if ($item->applied_discount_id) {
                    $nativeUnitDiscount = max(0, $originalPrice - $price);
                    $nativeLineDiscount = $nativeUnitDiscount * $item->quantity;
                    
                    if ($nativeLineDiscount > 0) {
                        \App\Models\Sales\SaleAppliedDiscount::create([
                            'sale_id'         => $sale->id,
                            'sale_detail_id'  => $detail->id,
                            'discount_id'     => $item->applied_discount_id,
                            'discount_amount' => $nativeLineDiscount,
                        ]);
                    }
                }

                // Determine branch to reserve from (per item fallback to main branch)
                $reserveBranchId = $request->branch_id;
                if ($itemsBranches->has($item->variant_id)) {
                    $reserveBranchId = $itemsBranches->get($item->variant_id)['branch_id'];
                }

                
            }

            // Update sale totals
            $shippingCost = (float)$request->input('shipping_cost', 0);
            $agencyDispatchCost = (float)$request->input('agency_dispatch_cost', 0);
            $sale->total = max(0, $sale->subtotal + $shippingCost + $agencyDispatchCost - ($sale->discount_total ?? 0));
            $sale->save();

            // Create Shipment
            $shipment = Shipment::create([
                'sale_id' => $sale->id,
                'status' => 'requested', // Social Network orders start at requested
                'shipping_cost' => $shippingCost,
                'agency_dispatch_cost' => $request->input('agency_dispatch_cost', null),
                'delivery_code' => str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT),
                'delivery_type' => $request->input('delivery_type', 'scheduled_point'),
                'pickup_branch_id' => $request->input('pickup_branch_id', null),
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


            // Ensure stock is reserved immediately if it starts in an applicable state
            $this->checkAndReserveStock($schedule, $schedule->status);

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
     * Convert a cart/proforma into a pending delivery order (draft).
     * This creates Sale + SaleDetails + Shipment + DeliverySchedule
     * WITHOUT stock reservations. The user completes details later in dashboard/orders.
     */
    public function convertToOrderDraft(Request $request)
    {
        $request->validate([
            'cart_id' => 'required|uuid|exists:carts,id',
        ]);

        try {
            DB::beginTransaction();

            $cart = Cart::with('items.product_variant.product')->findOrFail($request->cart_id);

            if ($cart->items->isEmpty()) {
                return response()->json(['error' => 'El carrito no tiene productos.'], 422);
            }
            if ($cart->status === 'converted' || $cart->status === 'ordered') {
                return response()->json(['error' => 'El carrito ya fue convertido.'], 400);
            }

            // Use existing guest/customer from the cart
            $guestId = $cart->guest_id;
            $customerId = $cart->customer_id;

            // Create Sale (delivery type, pending status, no branch)
            $sale = Sale::create([
                'customer_id' => $customerId,
                'guest_id' => $guestId,
                'branch_id' => null,
                'user_id' => auth()->id() ?? null,
                'invoice_number' => 'DLV-' . strtoupper(\Illuminate\Support\Str::random(6)),
                'sale_type' => 'delivery',
                'status' => 'pending',
                'source' => 'order_network',
                'subtotal' => collect($cart->items)->sum('dynamic_subtotal'),
                'discount_total' => $cart->dynamic_global_discount,
                'total' => $cart->total_amount,
                'notes' => 'Convertido desde proforma ' . ($cart->reference_number ?? $cart->id)
            ]);

            // Insert global cart discount ONE time
            if ($cart->discount_id && $cart->dynamic_global_discount > 0) {
                \App\Models\Sales\SaleAppliedDiscount::create([
                    'sale_id'         => $sale->id,
                    'sale_detail_id'  => null,
                    'discount_id'     => $cart->discount_id,
                    'discount_amount' => $cart->dynamic_global_discount,
                ]);
            }

            $deliveryDetails = $cart->delivery_details ?? [];
            $mappedDeliveryType = 'scheduled_point';
            $pickupBranchId = null;
            $externalCompany = null;
            $destinationCity = null;
            $notes = '';
            $addressId = null;
            $meetingPoint = 'Por definir';
            $scheduledDate = now()->addDays(1)->toDateString();

            if (!empty($deliveryDetails)) {
                $type = $deliveryDetails['type'] ?? '';
                if ($type === 'pickup') {
                    $mappedDeliveryType = 'pickup';
                    if (!empty($deliveryDetails['branch_id'])) {
                        $pickupBranchId = $deliveryDetails['branch_id'];
                    }
                } elseif ($type === 'meetup') {
                    $mappedDeliveryType = 'scheduled_point';
                    $destinationCity = $deliveryDetails['city'] ?? null;
                    if (!empty($deliveryDetails['zone_name'])) {
                        $meetingPoint = $deliveryDetails['zone_name'];
                    }
                } elseif ($type === 'delivery') {
                    $mappedDeliveryType = 'home_delivery';
                    $destinationCity = $deliveryDetails['city'] ?? null;
                      // Use existing address if provided, otherwise create a new Address record
                      if (!empty($deliveryDetails['address_id'])) {
                          $addressId = $deliveryDetails['address_id'];
                      } elseif ($sale->customer_id && (!empty($deliveryDetails['address']) || !empty($deliveryDetails['street']) || !empty($deliveryDetails['zone']))) {
                          $address = \App\Models\Core\Address::create([
                              'address_type' => 'shipping',
                              'customer_id' => $sale->customer_id,
                              'city' => $destinationCity,
                              'zone' => $deliveryDetails['zone'] ?? null,
                              'street' => $deliveryDetails['street'] ?? $deliveryDetails['address'] ?? null,
                              'reference' => $deliveryDetails['reference'] ?? null,
                              'is_default' => false
                          ]);
                          $addressId = $address->id;
                      }
                      
                      // For guests, or as a fallback, store the address in notes
                      if (!empty($deliveryDetails['address']) || !empty($deliveryDetails['street']) || !empty($deliveryDetails['zone'])) {
                          $addressParts = array_filter([
                              $deliveryDetails['city'] ?? '',
                              $deliveryDetails['zone'] ?? '',
                              $deliveryDetails['street'] ?? $deliveryDetails['address'] ?? '',
                              $deliveryDetails['reference'] ?? ''
                          ]);
                          $notes .= "Dirección de entrega: " . implode(', ', $addressParts) . "\n";
                          $meetingPoint = $deliveryDetails['street'] ?? $deliveryDetails['address'] ?? $deliveryDetails['zone'] ?? 'Por definir';
                      }
                } elseif ($type === 'national') {
                    $mappedDeliveryType = 'delivery_national';
                    $destinationCity = $deliveryDetails['destination'] ?? null;
                    $externalCompany = $deliveryDetails['company'] ?? null;
                    if (!empty($deliveryDetails['date'])) {
                        $scheduledDate = $deliveryDetails['date'];
                    }
                }
            }

            // Create Shipment
            $shipment = Shipment::create([
                'sale_id' => $sale->id,
                'status' => 'pending',
                'shipping_cost' => 0,
                'delivery_code' => str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT),
                'delivery_type' => $mappedDeliveryType,
                'pickup_branch_id' => $pickupBranchId,
                'external_company' => $externalCompany,
                'destination_city' => $destinationCity,
                'address_id' => $addressId,
                'notes' => trim($notes) ?: null,
            ]);

            // Create DeliverySchedule
            $schedule = DeliverySchedule::create([
                'shipment_id' => $shipment->id,
                'scheduled_date' => $scheduledDate,
                'time_window' => 'Por definir',
                'meeting_point' => $meetingPoint,
                'status' => 'pending',
            ]);

            foreach ($cart->items as $item) {
                $price = $item->dynamic_unit_price;
                $lineTotalBeforeGlobal = $item->dynamic_subtotal;
                $originalPrice = $item->variant ? $item->variant->price : ($item->original_price ?? $price);

                $detail = SaleDetail::create([
                    'sale_id'         => $sale->id,
                    'variant_id'      => $item->variant_id,
                    'quantity'        => $item->quantity,
                    'unit_price'      => $price,
                    'discount'        => 0,
                    'final_price'     => $price,
                    'subtotal'        => $lineTotalBeforeGlobal,
                    'original_price'  => $originalPrice,
                    'bundle_price'    => $item->bundle_group_id ? $price : null,
                    'bundle_group_id' => $item->bundle_group_id,
                ]);

                // Insert item-level native discount to applied discounts
                if ($item->applied_discount_id) {
                    $nativeUnitDiscount = max(0, $originalPrice - $price);
                    $nativeLineDiscount = $nativeUnitDiscount * $item->quantity;
                    
                    if ($nativeLineDiscount > 0) {
                        \App\Models\Sales\SaleAppliedDiscount::create([
                            'sale_id'         => $sale->id,
                            'sale_detail_id'  => $detail->id,
                            'discount_id'     => $item->applied_discount_id,
                            'discount_amount' => $nativeLineDiscount,
                        ]);
                    }
                }

                
            }

            // Update sale totals not needed, already handled on creation

            // Mark cart as ordered and do not delete
            $cart->status = 'ordered';
            $cart->expires_at = null;
            
            // Save converted info into delivery_details so frontend can show the success modal later
            $deliveryDetails['converted_schedule_id'] = $schedule->id;
            $deliveryDetails['converted_mapped_type'] = $mappedDeliveryType;
            $cart->delivery_details = $deliveryDetails;
            
            $cart->save();
            
            DB::commit();

            return response()->json([
                'message' => 'Carrito convertido a entrega pendiente exitosamente.',
                'schedule_id' => $schedule->id,
                'sale_id' => $sale->id,
                'applied_details' => $deliveryDetails,
                'mapped_type' => $mappedDeliveryType
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('OrderNetwork ConvertDraft Error: ' . $e->getMessage() . ' Trace: ' . $e->getTraceAsString());
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
            'shipment.pickupBranch.address',
            'shipment.sale.sale_details' => function($q) { 
                $q->withTrashed()->with([
                    'product_variant.product.product_images',
                    'product_variant.product.attribute_value_images',
                    'product_variant.size',
                    'product_variant.fit',
                    'product_variant.variant_attribute_values.attribute_value.attribute',
                    'product_variant.variant_images',
                    'product_variant.inventories.branch', 'sale_applied_discount',
                    'return_request'
                ]); 
            },
            'shipment.sale.guest', 
            'shipment.sale.customer.user.profile',
            'shipment.sale.customer.posProfile',
            'shipment.sale.customer.addresses',
            'shipment.sale.sale_applied_discounts.discount',
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
    
    protected function checkAndReserveStock($schedule, $status)
    {
        $deliveryType = $schedule->shipment->delivery_type ?? 'scheduled_point';
        $shouldReserve = false;
        
        $localReserveStates = ['assigned', 'on_the_way', 'at_the_meeting_point', 'completed'];
        $externalReserveStates = ['prepared', 'packaged', 'shipped', 'completed'];
        $pickupReserveStates = ['reserved', 'preparing', 'ready_for_pickup', 'completed'];

        if ($deliveryType === 'store_pickup' && in_array($status, $pickupReserveStates)) {
            $shouldReserve = true;
        } elseif ($deliveryType === 'agency_shipping' && in_array($status, $externalReserveStates)) {
            $shouldReserve = true;
        } elseif (in_array($deliveryType, ['home_delivery', 'scheduled_point']) && in_array($status, $localReserveStates)) {
            $shouldReserve = true;
        }
        
        // Fallback for safety
        if (in_array($status, ['completed', 'shipped'])) {
            $shouldReserve = true;
        }

        if ($shouldReserve) {
            $sale = $schedule->shipment->sale ?? null;
            if ($sale) {
                $branchId = $schedule->shipment->origin_branch_id ?? $schedule->shipment->pickup_branch_id ?? $sale->branch_id;
                if (!$branchId) {
                    $firstBranch = \App\Models\Branch\Branch::first();
                    $branchId = $firstBranch ? $firstBranch->id : null;
                }

                if ($branchId) {
                    foreach ($sale->sale_details()->whereNull('deleted_at')->get() as $detail) {
                        $exists = \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)
                            ->where('variant_id', $detail->variant_id)
                            ->exists();

                        if (!$exists) {
                            \App\Models\Inventory\StockReservation::create([
                                'sale_id' => $sale->id,
                                'variant_id' => $detail->variant_id,
                                'branch_id' => $branchId,
                                'quantity' => $detail->quantity,
                                'status' => 'reserved'
                            ]);

                            $inventory = \App\Models\Inventory\Inventory::where('branch_id', $branchId)
                                ->where('variant_id', $detail->variant_id)
                                ->first();
                                
                            if ($inventory) {
                                $stockBefore = $inventory->stock;
                                $inventory->stock = max(0, $inventory->stock - $detail->quantity);
                                $inventory->save();
                                
                                \App\Models\Inventory\InventoryMovement::create([
                                    'variant_id' => $detail->variant_id,
                                    'branch_id' => $branchId,
                                    'movement_type' => 'sale',
                                    'quantity' => (int) $detail->quantity,
                                    'stock_before' => $stockBefore,
                                    'stock_after' => $inventory->stock,
                                    'reference_type' => 'sale',
                                    'reference_id' => $sale->id,
                                    'created_by' => auth()->id() ?? null,
                                    'notes' => 'Reserva de stock en entrega ' . $schedule->shipment->delivery_code
                                ]);
                            }
                        }
                    }
                }
            }
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:requested,reserved,preparing,ready_for_pickup,pending,assigned,on_the_way,at_the_meeting_point,completed,cancelled,prepared,packaged,shipped'
        ]);

        try {
            DB::beginTransaction();

            $schedule = DeliverySchedule::with('shipment.sale')->findOrFail($id);
            $schedule->status = $request->status;
            $schedule->save();

            // Track the status change
            if ($schedule->shipment) {
                $description = 'El estado de la entrega cambió a ' . $request->status;
                if ($request->status === 'requested') $description = 'Pedido solicitado. Esperando confirmación de pago/adelanto.';
                if ($request->status === 'reserved') $description = 'Adelanto confirmado. Inventario reservado en sucursal.';
                if ($request->status === 'preparing') $description = 'El pedido se está preparando en sucursal.';
                if ($request->status === 'ready_for_pickup') $description = 'El pedido está listo para ser recogido por el cliente.';
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

            if (in_array($request->status, ['requested', 'reserved', 'preparing', 'ready_for_pickup'])) {
                $shipment = $schedule->shipment;
                $shipment->status = $request->status;
                $shipment->save();
            }

            $this->checkAndReserveStock($schedule, $request->status);

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
            $isAdvancePayment = $request->boolean('is_advance_payment', false);
            $isPaymentStage = ($request->status === 'completed' && !$isExternal) || 
                              ($request->status === 'prepared' && $isExternal) || 
                              $isAdvancePayment;

            if ($isPaymentStage) {
                $sale = $shipment->sale;
                
                // --- PAYMENT AND DISCOUNT LOGIC ---
                $amountPaid = $request->input('monto_real');
                if ($amountPaid !== null && $sale->status !== 'paid') {
                    
                    if (!$isAdvancePayment) {
                        $sale->status = 'paid';
                    }
                    
                    $amountPaid = (float) $amountPaid;
                    $totalPreviouslyPaid = $sale->payments()->sum('amount');
                    $discountDiff = !$isAdvancePayment ? max(0, $sale->total - $totalPreviouslyPaid - $amountPaid) : 0;

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
                        $sale->total = $totalPreviouslyPaid + $amountPaid;
                    }

                    // Create Payment Records
                    $paymentMethodType = $request->input('payment_method'); // 'efectivo', 'qr', 'ambos'
                    
                    if ($paymentMethodType) {
                        $cashMethodId = \App\Models\Finance\PaymentMethod::whereRaw('LOWER(name) = ?', ['efectivo'])->value('id');
                        $qrMethodId = \App\Models\Finance\PaymentMethod::whereRaw('LOWER(name) = ?', ['qr'])->value('id');
                        
                        // Default to cash register of the branch, if available
                        $cashRegisterId = \App\Models\Finance\CashRegister::where('branch_id', $sale->branch_id)->where('status', 'open')->value('id');
                        
                        if ($paymentMethodType === 'efectivo' && $cashMethodId && $amountPaid > 0) {
                            \App\Models\Finance\Payment::create([
                                'sale_id' => $sale->id,
                                'payment_method_id' => $cashMethodId,
                                'cash_register_id' => $cashRegisterId,
                                'amount' => $amountPaid,
                                'status' => 'completed'
                            ]);
                        } elseif ($paymentMethodType === 'qr' && $qrMethodId && $amountPaid > 0) {
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
                    // Confirm stock reservations only if not an advance payment
                    if (!$isAdvancePayment) {
                        \App\Models\Inventory\StockReservation::where('sale_id', $sale->id)
                            ->update(['status' => 'confirmed']);
                    }

                    // Clear the checkout session since it has been fulfilled
                    $schedule->checkout_session = null;
                    $schedule->save();
                    
                    try {
                        event(new \App\Events\CheckoutSessionShared($schedule->id, null));
                    } catch (\Throwable $eventError) {}
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
        
        $this->checkAndReserveStock($schedule, 'assigned');

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
            'pickup_branch_id' => 'nullable|uuid|exists:branches,id',
            'address_id' => 'nullable|uuid|exists:addresses,id',
            'recipient_name' => 'nullable|string|max:150',
            'recipient_ci' => 'nullable|string|max:50',
            'recipient_phone' => 'nullable|string|max:50',
            'destination_city' => 'nullable|string|max:150'
        ]);

        try {
            if ($request->has('delivery_type')) {
                $typeMap = [
                    'home_delivery' => 'delivery_home',
                    'scheduled_point' => 'delivery_scheduled_point',
                    'pickup' => 'delivery_pickup',
                    'external' => 'delivery_national'
                ];
                $settingKey = $typeMap[$request->delivery_type] ?? null;
                if ($settingKey) {
                    $isActive = \App\Models\System\SystemSetting::where('key', $settingKey)->value('value');
                    if ($isActive === 'false') {
                        return response()->json(['error' => 'El método de entrega seleccionado no está disponible en este momento.'], 400);
                    }
                }
            }
            
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

                $detail = SaleDetail::withTrashed()->where('sale_id', $sale->id)->where('variant_id', $item['variant_id'])->first();
                if ($detail) {
                    // If it was a bundle, respect its bundle_price even when updated
                    $effectivePrice = ($detail->bundle_group_id && $detail->bundle_price) ? $detail->bundle_price : $price;
                    $lineTotal = $effectivePrice * $item['quantity'];
                    
                    $detail->update([
                        'quantity' => $item['quantity'],
                        'unit_price' => $effectivePrice,
                        'final_price' => $effectivePrice,
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
                
                $subtotal += $lineTotal;

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
                if ($request->has('pickup_branch_id')) {
                    $schedule->shipment->pickup_branch_id = $request->pickup_branch_id;
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
            
            if ($request->has('status')) {
                $schedule->status = $request->status;
            }
            $schedule->save();
            
            $this->checkAndReserveStock($schedule, $schedule->status);

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
                return response()->json(['error' => 'Solo puedes agregar prendas cuando el pedido estÃƒÂ¡ en el punto de encuentro.'], 400);
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
                if (!isset($session['is_advance_payment']) || !$session['is_advance_payment']) {
                    $totalPaid = $sale->payments()->sum('amount');
                    $session['monto_real'] = max(0, $sale->total - $totalPaid);
                    $schedule->checkout_session = $session;
                    $schedule->save();
                }
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
                return response()->json(['error' => 'No puedes quitar la ÃƒÂºnica prenda de la entrega. Si el cliente no desea nada, cancela la entrega completa.'], 400);
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

            // --- Bundle disintegration ---
            // If the removed item belonged to a bundle, the remaining siblings
            // must revert to their original_price (their bundle discount is gone).
            if ($detail->bundle_group_id) {
                $siblings = $sale->sale_details()
                    ->whereNull('deleted_at')
                    ->where('bundle_group_id', $detail->bundle_group_id)
                    ->get();

                foreach ($siblings as $sibling) {
                    $restoredPrice = $sibling->original_price ?? $sibling->unit_price;
                    $priceDiff = $restoredPrice - $sibling->unit_price;

                    // Update price fields
                    $sibling->unit_price  = $restoredPrice;
                    $sibling->final_price = max(0, $restoredPrice - ($sibling->discount ?? 0));
                    $sibling->subtotal    = $sibling->final_price * $sibling->quantity;
                    $sibling->bundle_group_id = null; // No longer part of a bundle
                    $sibling->save();

                    // Adjust sale totals for the price difference
                    $sale->subtotal += $priceDiff * $sibling->quantity;
                    $sale->total    += $priceDiff * $sibling->quantity;
                }
                $sale->save();
            }

            if ($schedule->checkout_session) {
                $session = $schedule->checkout_session;
                if (!isset($session['is_advance_payment']) || !$session['is_advance_payment']) {
                    $totalPaid = $sale->payments()->sum('amount');
                    $session['monto_real'] = max(0, $sale->total - $totalPaid);
                    $schedule->checkout_session = $session;
                    $schedule->save();
                }
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

            // If still not found, it might have been hard-deleted by updateOrder. Recreate a released reservation.
            if (!$res && isset($detailFallback)) {
                $res = \App\Models\Inventory\StockReservation::create([
                    'sale_id'    => $sale->id,
                    'variant_id' => $detailFallback->variant_id,
                    'branch_id'  => $schedule->shipment->origin_branch_id ?? $sale->branch_id ?? \App\Models\Company\Branch::where('is_active', true)->first()->id ?? null,
                    'quantity'   => 1,
                    'status'     => 'released'
                ]);
            }

            if (!$res) {
                return response()->json(['error' => 'Reserva de stock no encontrada.'], 404);
            }
            
            $detail = $sale->sale_details()->withTrashed()->where('variant_id', $res->variant_id)->first();

            if (!$detail || !$detail->trashed()) {
                return response()->json(['error' => 'La prenda no estÃƒÂ¡ eliminada.'], 400);
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

            // Update Sale totals (using original_price since the item was stored at bundle price when deleted)
            $sale->subtotal += $detail->unit_price;
            $sale->total += $detail->unit_price;
            $sale->save();

            // Restore the soft-deleted detail
            $detail->restore();

            // --- Bundle reintegration ---
            // The restored detail still has its original bundle_group_id stored (it was never cleared from the
            // soft-deleted record). Siblings had their bundle_group_id set to null and their price reverted to
            // original_price when the item was removed. We identify those sibling candidates by finding active
            // sale_details in this sale where unit_price == original_price (i.e., they were reverted).
            // Re-marking them with the bundle_group_id is enough to restore the visual grouping in the UI.
            // Note: the actual bundle unit prices were already reverted to original on removal; this only
            // re-applies the grouping badge — not the discounted price (which is now their regular price since
            // the bundle was broken). We just sync the bundle_group_id so the UI shows them connected again.
            $originalBundleGroupId = $detail->bundle_group_id;

            if ($originalBundleGroupId) {
                $potentialSiblings = $sale->sale_details()
                    ->whereNull('deleted_at')
                    ->whereNotNull('original_price')
                    ->whereColumn('unit_price', 'original_price')
                    ->where('id', '!=', $detail->id)
                    ->get();

                foreach ($potentialSiblings as $sibling) {
                    $sibling->bundle_group_id = $originalBundleGroupId;
                    if ($sibling->bundle_price) {
                        $diff = $sibling->unit_price - $sibling->bundle_price;
                        $sibling->unit_price = $sibling->bundle_price;
                        $sibling->final_price = max(0, $sibling->bundle_price - ($sibling->discount ?? 0));
                        $sibling->subtotal = $sibling->final_price * $sibling->quantity;
                        $sale->subtotal -= $diff * $sibling->quantity;
                        $sale->total -= $diff * $sibling->quantity;
                    }
                    $sibling->save();
                }

                $detail->bundle_group_id = $originalBundleGroupId;
                if ($detail->bundle_price && $detail->unit_price != $detail->bundle_price) {
                    $diff = $detail->unit_price - $detail->bundle_price;
                    $detail->unit_price = $detail->bundle_price;
                    $detail->final_price = max(0, $detail->bundle_price - ($detail->discount ?? 0));
                    $detail->subtotal = $detail->final_price * $detail->quantity;
                    $sale->subtotal -= $diff * $detail->quantity;
                    $sale->total -= $diff * $detail->quantity;
                }
                $detail->save();
                $sale->save();
            }

            if ($schedule->checkout_session) {
                $session = $schedule->checkout_session;
                if (!isset($session['is_advance_payment']) || !$session['is_advance_payment']) {
                    $totalPaid = $sale->payments()->sum('amount');
                    $session['monto_real'] = max(0, $sale->total - $totalPaid);
                    $schedule->checkout_session = $session;
                    $schedule->save();
                }
            }

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

        return response()->json(['message' => 'SesiÃƒÂ³n de cobro compartida exitosamente.']);
    }

    public function applyDiscount(Request $request, $id, \App\Services\Finance\DiscountValidationService $discountService)
    {
        $request->validate([
            'code' => 'required|string'
        ]);

        $schedule = DeliverySchedule::with(['shipment.sale.sale_details', 'shipment.sale.sale_applied_discounts'])->findOrFail($id);
        $sale = $schedule->shipment->sale;

        if (!$sale) {
            return response()->json(['error' => 'No se encontró la venta asociada a esta entrega.'], 404);
        }

        // Rule: Solo uno (Only one discount/giftcard per sale)
        $hasGlobalDiscount = $sale->sale_applied_discounts->whereNull('sale_detail_id')->isNotEmpty();
        if ($hasGlobalDiscount || $sale->giftcard_id) {
            return response()->json(['error' => 'Esta venta ya tiene un descuento o giftcard aplicado.'], 400);
        }

        $code = trim($request->code);

        // Build items for validation service
        $items = $sale->sale_details->map(function($detail) use ($sale) {
            $hasNativeDiscount = $sale->sale_applied_discounts->where('sale_detail_id', $detail->id)->isNotEmpty();
            return [
                'variant_id' => $detail->variant_id,
                'line_subtotal' => $detail->subtotal,
                'bundle_group_id' => $detail->bundle_group_id,
                'applied_discount_id' => $hasNativeDiscount ? 'has_native' : null
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
            // Un solo registro de descuento global
            \App\Models\Sales\SaleAppliedDiscount::create([
                'sale_id' => $sale->id,
                'sale_detail_id' => null,
                'discount_id' => $result['id'],
                'discount_amount' => $discountAmount
            ]);
        }

        $sale->discount_total += $discountAmount;
        $sale->total = max(0, $sale->total - $discountAmount);
        $sale->save();

        if ($schedule->checkout_session) {
            $session = $schedule->checkout_session;
            if (!isset($session['is_advance_payment']) || !$session['is_advance_payment']) {
                $totalPaid = $sale->payments()->sum('amount');
                $session['monto_real'] = max(0, $sale->total - $totalPaid);
                $schedule->checkout_session = $session;
                $schedule->save();
            }
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
        $schedule = DeliverySchedule::with(['shipment.sale.sale_applied_discounts'])->findOrFail($id);
        $sale = $schedule->shipment->sale;

        $globalDiscount = $sale ? $sale->sale_applied_discounts->whereNull('sale_detail_id')->first() : null;

        if (!$sale || (!$globalDiscount && !$sale->giftcard_id)) {
            return response()->json(['error' => 'No hay descuento para quitar.'], 400);
        }

        $removedDiscountId = $globalDiscount ? $globalDiscount->discount_id : null;

        // Remove from applied discounts
        if ($globalDiscount) {
            \App\Models\Sales\SaleAppliedDiscount::where('id', $globalDiscount->id)->delete();
        }

        // Revert total
        $sale->total += $sale->discount_total;
        $sale->discount_total = 0;
        // $sale->discount_id = null; // No longer exists in sales table
        $sale->giftcard_id = null;
        $sale->save();

        if ($removedDiscountId) {
            $cartQuery = \App\Models\Sales\Cart::where('status', 'ordered')->where('discount_id', $removedDiscountId);
            
            if ($sale->customer_id) {
                $cartQuery->where('customer_id', $sale->customer_id);
            } elseif ($sale->guest_id) {
                $cartQuery->where('guest_id', $sale->guest_id);
            }

            $cartQuery->update([
                'discount_id' => null,
                'total_discount' => 0
            ]);
        }

        if ($schedule->checkout_session) {
            $session = $schedule->checkout_session;
            if (!isset($session['is_advance_payment']) || !$session['is_advance_payment']) {
                $totalPaid = $sale->payments()->sum('amount');
                $session['monto_real'] = max(0, $sale->total - $totalPaid);
                $schedule->checkout_session = $session;
                $schedule->save();
            }
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
            return response()->json(['error' => 'No se encontrÃƒÂ³ el envÃƒÂ­o.'], 404);
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
            'message' => $session['is_shared'] ? 'EdiciÃƒÂ³n compartida habilitada' : 'EdiciÃƒÂ³n deshabilitada',
            'shipment' => $schedule->shipment
        ]);
    }

    public function updateRecipientInfo(Request $request, $id)
    {
        $schedule = DeliverySchedule::with('shipment')->findOrFail($id);
        
        if (!$schedule->shipment) {
            return response()->json(['error' => 'No se encontrÃƒÂ³ el envÃƒÂ­o.'], 404);
        }

        $session = $schedule->shipment->recipient_edit_session;
        if (empty($session) || empty($session['is_shared'])) {
            return response()->json(['error' => 'La ediciÃƒÂ³n no estÃƒÂ¡ habilitada para este envÃƒÂ­o.'], 403);
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
            'message' => 'InformaciÃƒÂ³n actualizada correctamente',
            'shipment' => $schedule->shipment
        ]);
    }
}


