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
        $variant = $this->product_variant;
        $resolvedImage = null;

        if ($variant) {
            // 1. Imagen unitaria de la variante
            if ($variant->relationLoaded('variant_images') && $variant->variant_images && $variant->variant_images->isNotEmpty()) {
                $vImg = $variant->variant_images->first();
                $resolvedImage = $vImg->url ?? $vImg->image_path ?? null;
            }

            // 2. Imagen por color / atributo (coincidiendo con variant_attribute_values)
            if (!$resolvedImage && $variant->relationLoaded('variant_attribute_values') && $variant->variant_attribute_values && $variant->relationLoaded('product') && $variant->product && $variant->product->relationLoaded('attribute_value_images') && $variant->product->attribute_value_images) {
                foreach ($variant->variant_attribute_values as $vav) {
                    $attrImgs = $variant->product->attribute_value_images->where('attribute_value_id', $vav->attribute_value_id);
                    if ($attrImgs->isNotEmpty()) {
                        $attrImg = $attrImgs->firstWhere('is_main', true) ?? $attrImgs->first();
                        if ($attrImg) {
                            $resolvedImage = $attrImg->url ?? $attrImg->image_path ?? null;
                            break;
                        }
                    }
                }
            }

            // 3. Fallback a imagen del producto (priorizando is_main)
            if (!$resolvedImage && $variant->relationLoaded('product') && $variant->product && $variant->product->relationLoaded('product_images') && $variant->product->product_images && $variant->product->product_images->isNotEmpty()) {
                $pImg = $variant->product->product_images->firstWhere('is_main', true) ?? $variant->product->product_images->first();
                if ($pImg) {
                    $resolvedImage = $pImg->url ?? $pImg->image_path ?? null;
                }
            }

            // 4. Fallback a cualquier imagen de atributo del producto
            if (!$resolvedImage && $variant->relationLoaded('product') && $variant->product && $variant->product->relationLoaded('attribute_value_images') && $variant->product->attribute_value_images && $variant->product->attribute_value_images->isNotEmpty()) {
                $anyAttrImg = $variant->product->attribute_value_images->firstWhere('is_main', true) ?? $variant->product->attribute_value_images->first();
                if ($anyAttrImg) {
                    $resolvedImage = $anyAttrImg->url ?? $anyAttrImg->image_path ?? null;
                }
            }
        }

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
            'image' => $resolvedImage ?? optional(optional($this->product_variant)->product)->primary_image_url,
            
            // Expose product_variant and variant for frontend helpers
            'product_variant' => $this->whenLoaded('product_variant'),
            'variant' => $this->whenLoaded('product_variant'),

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
            
            // Return request
            'return_request' => $this->whenLoaded('return_request'),
        ];
    }
}
