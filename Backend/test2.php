<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sale = \App\Models\Sales\Sale::orderBy('created_at', 'desc')->first();
echo "SALE ID: " . $sale->id . "\n";
echo "MOVEMENTS FOR SALE:\n";
print_r(\App\Models\Inventory\InventoryMovement::where('reference_type', 'sale')->where('reference_id', $sale->id)->get()->toArray());
echo "MOVEMENTS FOR SCHEDULE:\n";
$schedule = \App\Models\Logistics\DeliverySchedule::whereHas('shipment', function($q) use($sale) { $q->where('sale_id', $sale->id); })->first();
print_r(\App\Models\Inventory\InventoryMovement::where('reference_type', 'delivery_schedule')->where('reference_id', $schedule->id)->get()->toArray());
