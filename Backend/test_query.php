<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sale = \App\Models\Sales\Sale::with(["guest"])->where(function($q) { 
    $q->where("invoice_number", "85581")
      ->orWhereHas("shipments", function($sq) { 
          $sq->where("delivery_code", "85581"); 
      }); 
})->first();

echo json_encode([
    "found" => $sale ? true : false, 
    "guest" => $sale ? $sale->guest : null,
    "invoice_number" => $sale ? $sale->invoice_number : null,
]);
