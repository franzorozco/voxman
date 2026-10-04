<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $totalPaid = $this->payments ? $this->payments->sum('amount') : 0;
        
        // Sum shipping costs from all shipments
        $shippingTotal = $this->shipments ? $this->shipments->sum(function($shipment) {
            $cost = $shipment->shipping_payment_type !== 'collect' ? (float) ($shipment->shipping_cost ?? 0) : 0;
            $agency = (float) ($shipment->agency_dispatch_cost ?? 0);
            return $cost + $agency;
        }) : 0;

        $saleTotal = (float) $this->dynamic_total; // Subtotal - Discounts
        $grandTotal = $saleTotal + $shippingTotal;
        $isFullyPaid = $this->status === 'paid';
        $balanceDue = $isFullyPaid ? 0 : max(0, $grandTotal - $totalPaid);

        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'created_at' => $this->created_at,
            'status' => $this->status,
            'source' => $this->source,
            'customer_id' => $this->customer_id,
            'branch_id' => $this->branch_id,
            
            // --- BACKWARD COMPATIBILITY KEYS (To prevent breaking old frontend components) ---
            'dynamic_total' => $saleTotal,
            'dynamic_subtotal' => (float) $this->dynamic_subtotal,
            'dynamic_global_discount' => (float) $this->dynamic_global_discount,
            'total' => $saleTotal,
            'subtotal' => (float) $this->dynamic_subtotal,
            
            // Financial calculations (Standardized for all modules)
            'financials' => [
                'items_count' => $this->sale_details ? $this->sale_details->count() : 0,
                'subtotal' => (float) $this->dynamic_subtotal,
                'global_discount' => (float) $this->dynamic_global_discount,
                'sale_total' => $saleTotal,
                'shipping_total' => $shippingTotal,
                'grand_total' => $grandTotal,
                'total_paid' => (float) $totalPaid,
                'balance_due' => (float) $balanceDue,
                'is_fully_paid' => $isFullyPaid,
            ],
            
            // Relationships (New Standard)
            'items' => SaleDetailResource::collection($this->whenLoaded('sale_details')),
            
            // --- BACKWARD COMPATIBILITY RELATIONSHIPS ---
            'sale_details' => $this->whenLoaded('sale_details'),
            'customer' => $this->whenLoaded('customer'),
            'user' => $this->whenLoaded('user'),
            'branch' => $this->whenLoaded('branch'),
            'giftcard_transactions' => $this->whenLoaded('giftcard_transactions'),
            'guest' => $this->whenLoaded('guest'),
            'stockReservations' => $this->whenLoaded('stockReservations'),
            'sale_applied_discounts' => $this->whenLoaded('sale_applied_discounts'),
            'discount' => $this->whenLoaded('discount'),
            // ---------------------------------------------
            
            'shipments' => $this->whenLoaded('shipments', function () {
                return $this->shipments->map(function($shipment) {
                    return [
                        'id' => $shipment->id,
                        'status' => $shipment->status,
                        'delivery_type' => $shipment->delivery_type,
                        'tracking_code' => $shipment->tracking_code,
                        'shipped_at' => $shipment->shipped_at,
                        'delivered_at' => $shipment->delivered_at,
                        'shipping_cost' => (float) $shipment->shipping_cost,
                        'address' => $shipment->address,
                        'delivery_schedule' => $shipment->delivery_schedule,
                    ];
                });
            }),
            
            'payments' => $this->whenLoaded('payments'),
            'applied_discounts' => $this->whenLoaded('sale_applied_discounts'),
        ];
    }
}
