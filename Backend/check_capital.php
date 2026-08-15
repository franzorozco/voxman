<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$owner = App\Models\Actors\Owner::first();
if ($owner) {
    echo "Owner: " . $owner->id . "\n";
    $deposits = App\Models\Finance\OwnerPayment::where('owner_id', $owner->id)->sum('total_amount');
    echo "Deposits: " . $deposits . "\n";
    
    $cost = App\Models\Inventory\Inventory::whereHas('variant.product', function($q) use ($owner) {
        $q->where('owner_id', $owner->id);
    })->get()->sum(function($inv) {
        return $inv->stock * $inv->variant->cost;
    });
    echo "Total Inventory Cost: " . $cost . "\n";
} else {
    echo "No owner found.\n";
}
