<?php

namespace App\Services\Finance;

use App\Models\Sales\Sale;
use App\Models\Sales\SaleDetail;
use App\Models\Inventory\Inventory;
use App\Models\Inventory\InventoryMovement;
use App\Models\Inventory\StockReservation;
use Illuminate\Support\Facades\DB;
use App\Services\Finance\DiscountValidationService;

class SalePricingService
{
    protected $discountService;

    public function __construct(DiscountValidationService $discountService)
    {
        $this->discountService = $discountService;
    }

    /**
     * Recalcula todos los totales de una venta (Sale) basándose en sus detalles activos (SaleDetail).
     * Esto incluye restaurar precios de combos rotos, sumar subtotales y aplicar descuentos globales.
     * 
     * @param Sale $sale
     * @return Sale
     */
    public function recalculateSaleTotals(Sale $sale)
    {
        $details = $sale->sale_details()->whereNull('deleted_at')->get();
        $subtotal = 0;

        // Validar y agrupar bundles
        $bundleCounts = [];
        foreach ($details as $detail) {
            if ($detail->bundle_group_id) {
                if (!isset($bundleCounts[$detail->bundle_group_id])) {
                    $bundleCounts[$detail->bundle_group_id] = 0;
                }
                $bundleCounts[$detail->bundle_group_id] += $detail->quantity;
            }
        }

        foreach ($details as $detail) {
            // Check if bundle is broken (only 1 item left in the group)
            if ($detail->bundle_group_id && $bundleCounts[$detail->bundle_group_id] < 2) {
                // Break bundle
                $detail->bundle_group_id = null;
                $detail->unit_price = $detail->original_price ?? $detail->unit_price;
                $detail->bundle_price = null;
            }

            // Calculate final price per line
            $detail->final_price = max(0, $detail->unit_price - ($detail->discount ?? 0));
            $detail->subtotal = $detail->final_price * $detail->quantity;
            $detail->save();

            $subtotal += $detail->subtotal;
        }

        $sale->subtotal = $subtotal;

        // Apply global discounts (if any)
        $globalDiscount = $sale->sale_applied_discounts()->whereNull('sale_detail_id')->first();
        $discountAmount = 0;

        if ($globalDiscount) {
            // Re-validate discount
            try {
                $items = $details->map(function($d) use ($sale) {
                    $hasNative = $sale->sale_applied_discounts()->where('sale_detail_id', $d->id)->exists();
                    return [
                        'variant_id' => $d->variant_id,
                        'line_subtotal' => $d->subtotal,
                        'bundle_group_id' => $d->bundle_group_id,
                        'applied_discount_id' => $hasNative ? 'has_native' : null
                    ];
                });

                $discountRecord = \App\Models\Discount\Discount::find($globalDiscount->discount_id);
                if ($discountRecord) {
                    $res = $this->discountService->validateCode($discountRecord->code, $subtotal, $items, $sale->customer_id);
                    if (!$res['valid']) {
                        throw new \Exception($res['message']);
                    }
                    $discountAmount = $res['discount_amount'];
                    
                    $globalDiscount->discount_amount = $discountAmount;
                    $globalDiscount->save();
                }
            } catch (\Exception $e) {
                // Discount no longer valid, remove it
                \Illuminate\Support\Facades\Log::error('recalculateSaleTotals discount validation failed: ' . $e->getMessage());
                $globalDiscount->delete();
                $discountAmount = 0;
            }
        }

        $sale->discount_total = $discountAmount;
        
        // Cargar costos adicionales (envíos) si existen
        $shippingCost = 0;
        $agencyCost = 0;
        $shipment = $sale->shipments()->first();
        if ($shipment) {
            $shippingCost = $shipment->shipping_cost ?? 0;
            $agencyCost = $shipment->agency_dispatch_cost ?? 0;
        }

        $sale->total = max(0, $sale->subtotal + $shippingCost + $agencyCost - $sale->discount_total);
        $sale->save();

        return $sale;
    }

    /**
     * Agrega un producto a la venta, reserva stock y recalcula los precios.
     */
    public function addProduct(Sale $sale, $variantId, $quantity, $branchId, $createdBy = null)
    {
        $variant = \App\Models\Catalog\ProductVariant::with('product')->findOrFail($variantId);

        $inv = Inventory::where('branch_id', $branchId)
            ->where('variant_id', $variantId)
            ->lockForUpdate()
            ->first();

        if (!$inv || $inv->stock < $quantity) {
            throw new \Exception('No hay stock suficiente para agregar esta prenda.');
        }

        $stockBefore = $inv->stock;
        $inv->stock -= $quantity;
        $inv->save();

        InventoryMovement::create([
            'variant_id' => $variantId,
            'branch_id' => $branchId,
            'movement_type' => 'sale',
            'quantity' => $quantity,
            'stock_before' => $stockBefore,
            'stock_after' => $inv->stock,
            'reference_type' => 'sale',
            'reference_id' => $sale->id,
            'created_by' => $createdBy,
        ]);

        $res = StockReservation::where('sale_id', $sale->id)
            ->where('variant_id', $variantId)
            ->where('branch_id', $branchId)
            ->first();

        if ($res) {
            if ($res->status === 'released') {
                $res->update(['status' => 'confirmed', 'quantity' => $quantity]);
            } else {
                $res->increment('quantity', $quantity);
            }
        } else {
            StockReservation::create([
                'sale_id' => $sale->id,
                'variant_id' => $variantId,
                'branch_id' => $branchId,
                'quantity' => $quantity,
                'status' => 'confirmed'
            ]);
        }

        $price = $variant->price ?? $variant->product->base_price ?? 0;
        $detail = $sale->sale_details()->where('variant_id', $variantId)->first();

        if ($detail) {
            $detail->quantity += $quantity;
            $detail->save();
        } else {
            $sale->sale_details()->create([
                'variant_id' => $variantId,
                'quantity' => $quantity,
                'unit_price' => $price,
                'original_price' => $price,
                'discount_amount' => 0,
                'notes' => 'Agregado manual'
            ]);
        }

        return $this->recalculateSaleTotals($sale);
    }

    /**
     * Remueve un producto de la venta, libera stock y recalcula los precios.
     */
    public function removeProduct(Sale $sale, $reservationId, $quantityToRemove = 1, $createdBy = null)
    {
        $res = StockReservation::where('sale_id', $sale->id)->find($reservationId);

        if (!$res) {
            // Fallback: Si enviaron el ID de SaleDetail en lugar de StockReservation
            $detailFallback = $sale->sale_details()->find($reservationId);
            if ($detailFallback) {
                $res = StockReservation::where('sale_id', $sale->id)->where('variant_id', $detailFallback->variant_id)->first();
            }
        }

        if (!$res) {
            throw new \Exception('Reserva de stock no encontrada.');
        }

        $detail = $sale->sale_details()->where('variant_id', $res->variant_id)->first();
        if (!$detail) {
            throw new \Exception('Detalle de venta no encontrado.');
        }

        // Devolver stock
        if ($res->status !== 'released') {
            $inv = Inventory::where('branch_id', $res->branch_id)
                ->where('variant_id', $res->variant_id)
                ->lockForUpdate()
                ->first();
            
            if ($inv) {
                $stockBefore = $inv->stock;
                $inv->stock += $quantityToRemove;
                $inv->save();

                InventoryMovement::create([
                    'variant_id' => $res->variant_id,
                    'branch_id' => $res->branch_id,
                    'movement_type' => 'return',
                    'quantity' => $quantityToRemove,
                    'stock_before' => $stockBefore,
                    'stock_after' => $inv->stock,
                    'reference_type' => 'sale',
                    'reference_id' => $sale->id,
                    'created_by' => $createdBy,
                ]);
            }
            
            if ($res->quantity > $quantityToRemove) {
                $res->quantity -= $quantityToRemove;
                $res->save();
            } else {
                $res->update(['status' => 'released']);
            }
        }

        if ($detail->quantity > $quantityToRemove) {
            $detail->quantity -= $quantityToRemove;
            $detail->save();
        } else {
            $detail->delete();
        }

        return $this->recalculateSaleTotals($sale);
    }

    /**
     * Aplica un descuento global a la venta.
     */
    public function applyDiscount(Sale $sale, $code)
    {
        $details = $sale->sale_details;
        $items = $details->map(function($d) use ($sale) {
            $hasNative = $sale->sale_applied_discounts()->where('sale_detail_id', $d->id)->exists();
            return [
                'variant_id' => $d->variant_id,
                'line_subtotal' => $d->subtotal,
                'bundle_group_id' => $d->bundle_group_id,
                'applied_discount_id' => $hasNative ? 'has_native' : null
            ];
        })->toArray();

        $result = $this->discountService->validateCode(
            $code,
            $sale->subtotal,
            $items,
            $sale->customer_id
        );

        if (!$result['valid']) {
            throw new \Exception($result['message']);
        }

        $discountAmount = $result['discount_amount'];

        $globalDiscount = $sale->sale_applied_discounts()->whereNull('sale_detail_id')->first();
        if ($globalDiscount) {
            $globalDiscount->update([
                'discount_id' => $result['id'],
                'discount_amount' => $discountAmount
            ]);
        } else {
            \App\Models\Sales\SaleAppliedDiscount::create([
                'sale_id' => $sale->id,
                'sale_detail_id' => null,
                'discount_id' => $result['id'],
                'discount_amount' => $discountAmount
            ]);
        }

        return $this->recalculateSaleTotals($sale);
    }

    /**
     * Remueve el descuento global.
     */
    public function removeDiscount(Sale $sale)
    {
        $globalDiscount = $sale->sale_applied_discounts()->whereNull('sale_detail_id')->first();
        if ($globalDiscount) {
            $globalDiscount->delete();
        }
        
        $sale->giftcard_id = null;
        $sale->discount_total = 0;
        $sale->save();

        return $this->recalculateSaleTotals($sale);
    }
}
