<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Sales\Cart;
use App\Models\Sales\CartItem;
use App\Models\Actors\Customer;
use App\Models\Catalog\ProductVariant;
use Illuminate\Support\Str;

class CartTestSeeder extends Seeder
{
    public function run()
    {
        // Get 3 web customers
        $customers = Customer::whereNotNull('user_id')->take(3)->get();
        if ($customers->isEmpty()) {
            echo "No web customers found.\n";
            return;
        }

        // Get some variants
        $variants = ProductVariant::take(10)->get();
        if ($variants->isEmpty()) {
            echo "No variants found.\n";
            return;
        }

        foreach ($customers as $customer) {
            $cart = Cart::create([
                'customer_id' => $customer->id,
                'reference_number' => 'CART-' . strtoupper(Str::random(6)),
                'status' => 'active',
                'source' => 'web',
                'created_at' => now()->subHours(rand(1, 48)),
                'updated_at' => now()
            ]);

            $randomVariants = $variants->random(rand(1, 4));
            foreach ($randomVariants as $variant) {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'variant_id' => $variant->id,
                    'quantity' => rand(1, 3),
                    'created_at' => now()
                ]);
            }
        }
        
        echo "Carts seeded successfully.\n";
    }
}
