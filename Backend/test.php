<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sale = \App\Models\Sales\Sale::orderBy('created_at', 'desc')->first();
echo "SALE ID: " . $sale->id . "\n";
echo "RESERVATIONS:\n";
print_r(\App\Models\Inventory\StockReservation::where('sale_id', $sale->id)->get()->toArray());
echo "DETAILS:\n";
print_r(\App\Models\Sales\SaleDetail::where('sale_id', $sale->id)->withTrashed()->get()->toArray());
