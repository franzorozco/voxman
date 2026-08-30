<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\Core\User::first();
$customer = $user->customers()->first();

$uniqueId = mt_rand(10000, 99999);
$referenceNumber = 'ORD-' . $uniqueId;

try {
    $cart = \App\Models\Sales\Cart::create([
        'customer_id' => $customer->id,
        'reference_number' => $referenceNumber,
        'source' => 'web',
        'status' => 'active',
        'expires_at' => now()->addMinutes(20),
    ]);
    
    $variant = \App\Models\Catalog\ProductVariant::first();
    $branch = \App\Models\Inventory\Branch::first();

    $res = \App\Models\Inventory\StockReservation::create([
        'branch_id' => $branch->id,
        'variant_id' => $variant->id,
        'quantity' => 1,
        'status' => 'reserved'
    ]);

    \App\Models\Sales\CartItem::create([
        'cart_id' => $cart->id,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);

    echo "Success! Cart: " . $cart->id . " | Res: " . $res->id . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
