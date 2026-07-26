<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$sale = App\Models\Sales\Sale::with('sale_details')->latest()->first();
if (!$sale) { echo 'No sale found'; exit; }
$items = $sale->sale_details->map(function($detail) { return ['variant_id' => $detail->variant_id, 'line_subtotal' => $detail->subtotal]; })->toArray();
$service = app(\App\Services\Finance\DiscountValidationService::class);
dump($service->getBestAutomaticDiscount($sale->subtotal, $items, $sale->customer_id, $sale->branch_id));
