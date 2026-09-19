<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Actors\Customer;
use App\Models\Branch\Branch;
use App\Models\Core\User;
use App\Models\Finance\PaymentMethod;
use App\Models\Catalog\ProductVariant;
use App\Models\Sales\Sale;
use App\Models\Sales\SaleDetail;
use App\Models\Finance\Payment;
use App\Models\Inventory\Inventory;
use App\Models\Inventory\InventoryMovement;
use App\Models\Discount\Discount;
use App\Models\Sales\SaleAppliedDiscount;
use App\Models\Finance\Giftcard;
use App\Models\Finance\GiftcardTransaction;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DummySalesSeeder extends Seeder
{
    public function run()
    {
        // 1. Encontrar los actores específicos requeridos por el usuario
        $user = User::where('email', 'owner1@voxman.com')->first();
        if (!$user) {
            $this->command->error("No se encontró el usuario manager owner1@voxman.com");
            return;
        }

        $customerUser = User::where('email', 'hola@gmail.com')->first();
        if (!$customerUser) {
            $this->command->error("No se encontró el usuario cliente hola@gmail.com");
            return;
        }

        $customer = Customer::where('user_id', $customerUser->id)->first();
        if (!$customer) {
            $this->command->error("No se encontró el registro Customer para hola@gmail.com");
            return;
        }

        $branch = Branch::first();
        $cashPaymentMethod = PaymentMethod::where('name', 'Efectivo')->first() ?? PaymentMethod::create([
            'id' => (string) Str::uuid(),
            'name' => 'Efectivo'
        ]);

        $cardPaymentMethod = PaymentMethod::where('name', 'Tarjeta')->first() ?? PaymentMethod::create([
            'id' => (string) Str::uuid(),
            'name' => 'Tarjeta'
        ]);

        $giftcardPaymentMethod = PaymentMethod::where('name', 'Giftcard')->first() ?? PaymentMethod::create([
            'id' => (string) Str::uuid(),
            'name' => 'Giftcard'
        ]);

        $variants = ProductVariant::inRandomOrder()->limit(5)->get();

        if (!$branch || $variants->isEmpty()) {
            $this->command->error("Faltan sucursales o variantes de productos.");
            return;
        }

        $this->command->info('Generando flujos de ventas complejos...');

        DB::beginTransaction();

        try {
            // Helper para registrar inventario
            $processInventory = function ($variantId, $branchId, $qty, $reference) use ($user) {
                $inventory = Inventory::firstOrCreate(
                    ['branch_id' => $branchId, 'variant_id' => $variantId],
                    ['stock' => 50, 'min_stock' => 0] 
                );

                if ($inventory->stock < $qty) {
                    $inventory->stock = $qty + 50; // Give it enough stock artificially for the dummy sale
                    $inventory->save();
                }

                $stockBefore = $inventory->stock;
                $inventory->decrement('stock', $qty);
                $stockAfter = $inventory->stock;

                InventoryMovement::create([
                    'id' => (string) Str::uuid(),
                    'variant_id' => $variantId,
                    'branch_id' => $branchId,
                    'created_by' => $user->id,
                    'movement_type' => 'sale',
                    'quantity' => $qty,
                    'reference' => $reference,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'notes' => 'Venta en tienda física'
                ]);
            };

            // Escenario 1: Venta Estándar con Movimiento de Inventario y Puntos
            $this->command->info('-> Ejecutando Escenario 1: Venta Regular');
            $sale1 = Sale::create([
                'id' => (string) Str::uuid(),
                'branch_id' => $branch->id,
                'user_id' => $user->id,
                'customer_id' => $customer->id,
                'sale_type' => 'store',
                'status' => 'paid',
                'source' => 'store',
                'subtotal' => 0,
                'discount_total' => 0,
                'total' => 0,
                'invoice_number' => 'INV-E1-' . strtoupper(Str::random(4)),
                'created_at' => now()->subDays(5),
            ]);

            $subtotal1 = 0;
            $sale1Variants = $variants->random(2);
            foreach ($sale1Variants as $variant) {
                $qty = 2;
                $price = $variant->price ?? 150;
                $lineTotal = $qty * $price;
                $subtotal1 += $lineTotal;

                SaleDetail::create([
                    'id' => (string) Str::uuid(),
                    'sale_id' => $sale1->id,
                    'variant_id' => $variant->id,
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'subtotal' => $lineTotal,
                    'discount' => 0,
                    'final_price' => $lineTotal,
                ]);

                $processInventory($variant->id, $branch->id, $qty, 'Venta #' . $sale1->invoice_number);
            }

            $sale1->update(['subtotal' => $subtotal1, 'total' => $subtotal1]);
            Payment::create(['id' => (string) Str::uuid(), 'sale_id' => $sale1->id, 'payment_method_id' => $cashPaymentMethod->id, 'amount' => $subtotal1, 'status' => 'completed']);
            $customer->increment('points', floor($subtotal1 / 10)); // 1 punto cada 10 usd/bs


            // Escenario 2: Venta con Descuento Aplicado
            $this->command->info('-> Ejecutando Escenario 2: Venta con Descuento');
            $discount = Discount::create([
                'id' => (string) Str::uuid(),
                'name' => 'Descuento Especial 20%',
                'type' => 'percentage',
                'value' => 20,
                'is_automatic' => false
            ]);

            $sale2 = Sale::create([
                'id' => (string) Str::uuid(),
                'branch_id' => $branch->id,
                'user_id' => $user->id,
                'customer_id' => $customer->id,
                'sale_type' => 'store',
                'status' => 'paid',
                'source' => 'store',
                'subtotal' => 0,
                'discount_total' => 0,
                'total' => 0,
                'invoice_number' => 'INV-E2-' . strtoupper(Str::random(4)),
                'created_at' => now()->subDays(3),
            ]);

            $subtotal2 = 0;
            $discountTotal2 = 0;
            $variant2 = $variants->random();
            $qty2 = 3;
            $price2 = $variant2->price ?? 100;
            $lineTotal2 = $qty2 * $price2;
            $lineDiscount2 = $lineTotal2 * 0.20; // 20%
            $finalPrice2 = $lineTotal2 - $lineDiscount2;

            $subtotal2 += $lineTotal2;
            $discountTotal2 += $lineDiscount2;

            $saleDetail2 = SaleDetail::create([
                'id' => (string) Str::uuid(),
                'sale_id' => $sale2->id,
                'variant_id' => $variant2->id,
                'quantity' => $qty2,
                'unit_price' => $price2,
                'subtotal' => $lineTotal2,
                'discount' => $lineDiscount2,
                'final_price' => $finalPrice2,
            ]);

            SaleAppliedDiscount::create([
                'id' => (string) Str::uuid(),
                'sale_id' => $sale2->id,
                'sale_detail_id' => $saleDetail2->id,
                'discount_id' => $discount->id,
                'discount_amount' => $lineDiscount2
            ]);

            $processInventory($variant2->id, $branch->id, $qty2, 'Venta #' . $sale2->invoice_number);

            $sale2->update(['subtotal' => $subtotal2, 'discount_total' => $discountTotal2, 'total' => $subtotal2 - $discountTotal2]);
            Payment::create(['id' => (string) Str::uuid(), 'sale_id' => $sale2->id, 'payment_method_id' => $cardPaymentMethod->id, 'amount' => $sale2->total, 'status' => 'completed']);
            $customer->increment('points', floor($sale2->total / 10));


            // Escenario 3: Compra de una Giftcard
            $this->command->info('-> Ejecutando Escenario 3: Emisión de Giftcard');
            $sale3 = Sale::create([
                'id' => (string) Str::uuid(),
                'branch_id' => $branch->id,
                'user_id' => $user->id,
                'customer_id' => $customer->id,
                'sale_type' => 'store',
                'status' => 'paid',
                'source' => 'store',
                'subtotal' => 500,
                'discount_total' => 0,
                'total' => 500,
                'invoice_number' => 'INV-E3-GC' . strtoupper(Str::random(3)),
                'created_at' => now()->subDays(2),
                'notes' => 'Compra de Giftcard'
            ]);

            Payment::create(['id' => (string) Str::uuid(), 'sale_id' => $sale3->id, 'payment_method_id' => $cashPaymentMethod->id, 'amount' => 500, 'status' => 'completed']);
            $customer->increment('points', 50); // 500 / 10

            $giftcard = Giftcard::create([
                'id' => (string) Str::uuid(),
                'code' => 'GC-' . strtoupper(Str::random(8)),
                'initial_balance' => 500,
                'current_balance' => 500,
                'customer_id' => $customer->id,
                'purchaser_id' => $customer->id,
                'is_active' => true,
                'is_digitalized' => false
            ]);

            GiftcardTransaction::create([
                'id' => (string) Str::uuid(),
                'giftcard_id' => $giftcard->id,
                'type' => 'issue',
                'amount' => 500,
                'sale_id' => $sale3->id,
                'notes' => 'Emisión por compra en tienda'
            ]);

            // Escenario 4: Compra pagada con Giftcard
            $this->command->info('-> Ejecutando Escenario 4: Compra usando Giftcard');
            $sale4 = Sale::create([
                'id' => (string) Str::uuid(),
                'branch_id' => $branch->id,
                'user_id' => $user->id,
                'customer_id' => $customer->id,
                'sale_type' => 'store',
                'status' => 'paid',
                'source' => 'store',
                'subtotal' => 0,
                'discount_total' => 0,
                'total' => 0,
                'invoice_number' => 'INV-E4-' . strtoupper(Str::random(4)),
                'created_at' => now(),
            ]);

            $variant4 = $variants->random();
            $qty4 = 2; // Asumiendo que cuesta algo y total será menor o mayor a 500
            $price4 = $variant4->price ?? 120;
            $lineTotal4 = $qty4 * $price4; // ej. 240

            SaleDetail::create([
                'id' => (string) Str::uuid(),
                'sale_id' => $sale4->id,
                'variant_id' => $variant4->id,
                'quantity' => $qty4,
                'unit_price' => $price4,
                'subtotal' => $lineTotal4,
                'discount' => 0,
                'final_price' => $lineTotal4,
            ]);

            $processInventory($variant4->id, $branch->id, $qty4, 'Venta #' . $sale4->invoice_number);

            $sale4->update(['subtotal' => $lineTotal4, 'total' => $lineTotal4]);

            // Pago con Giftcard
            $montoAPagarConGiftcard = min($lineTotal4, $giftcard->current_balance);
            Payment::create(['id' => (string) Str::uuid(), 'sale_id' => $sale4->id, 'payment_method_id' => $giftcardPaymentMethod->id, 'amount' => $montoAPagarConGiftcard, 'status' => 'completed']);
            
            $giftcard->decrement('current_balance', $montoAPagarConGiftcard);
            
            GiftcardTransaction::create([
                'id' => (string) Str::uuid(),
                'giftcard_id' => $giftcard->id,
                'type' => 'redemption',
                'amount' => $montoAPagarConGiftcard,
                'sale_id' => $sale4->id,
                'notes' => 'Redención en venta ' . $sale4->invoice_number
            ]);

            // Split payment si falta dinero
            $restante = $lineTotal4 - $montoAPagarConGiftcard;
            if ($restante > 0) {
                Payment::create(['id' => (string) Str::uuid(), 'sale_id' => $sale4->id, 'payment_method_id' => $cardPaymentMethod->id, 'amount' => $restante, 'status' => 'completed']);
            }

            $customer->increment('points', floor($lineTotal4 / 10));

            DB::commit();
            $this->command->info('✅ ¡Se generaron todos los flujos reales (ventas, inventario, puntos, descuentos y giftcards) correctamente para owner1@voxman.com y hola@gmail.com!');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error al insertar ventas complejas: ' . $e->getMessage() . ' Línea: ' . $e->getLine());
        }
    }
}
