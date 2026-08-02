<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $schedule = \App\Models\Logistics\DeliverySchedule::with('shipment.sale')->where('id', '019fb881-8fe4-72f0-bc5c-87501d672e05')->first();
    if (!$schedule) { echo "Schedule not found!"; exit; }
    
    $shipment = $schedule->shipment;
    if (!$shipment) { echo "Shipment not found!"; exit; }
    
    $sale = $shipment->sale;
    if (!$sale) { echo "Sale not found!"; exit; }

    echo "ALL OK";
} catch (\Throwable $e) {
    echo $e->getMessage() . "\n" . $e->getTraceAsString();
}
