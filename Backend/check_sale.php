<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$sale = App\Models\Sales\Sale::with('sale_details')->latest()->first();
if ($sale) {
    echo "Sale ID: " . $sale->id . "\n";
    echo "Sale subtotal: " . $sale->subtotal . "\n";
    echo "Sale discount_total: " . $sale->discount_total . "\n";
    echo "Sale total: " . $sale->total . "\n";
    foreach($sale->sale_details as $d) {
        echo "  Detail price: " . $d->unit_price . " discount: " . $d->discount . " final_price: " . $d->final_price . " subtotal: " . $d->subtotal . "\n";
    }
}
