<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sale_id' => $this->sale_id,
            'product_variant_id' => $this->product_variant_id,
            'quantity' => (int) $this->quantity,
            
            // Product info
            'product_name' => optional(optional($this->product_variant)->product)->name,
            'size' => optional(optional($this->product_variant)->size)->name,
            'fit' => optional(optional($this->product_variant)->fit)->name,
            'sku' => optional($this->product_variant)->sku,
            'image' => optional(optional($this->product_variant)->product)->primary_image_url,
            
            // Pricing details
            'unit_price' => (float) $this->dynamic_unit_price,
            'original_price' => (float) ($this->original_price ?? $this->unit_price),
            'discount' => (float) $this->discount,
            'final_price' => (float) $this->dynamic_subtotal,
            
            // Bundle info
            'bundle_group_id' => $this->bundle_group_id,
            
            // Applied discount (if any)
            'applied_discount' => $this->whenLoaded('sale_applied_discount', function () {
                return [
                    'id' => $this->sale_applied_discount->id,
                    'discount_id' => $this->sale_applied_discount->discount_id,
                    'amount' => (float) $this->sale_applied_discount->discount_amount,
                ];
            }),
        ];
    }
}
