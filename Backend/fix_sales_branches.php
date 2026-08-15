<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$sales = App\Models\Sales\Sale::whereNull('branch_id')->where('sale_type', 'delivery')->get();
echo "Found " . $sales->count() . " delivery sales with null branch_id.\n";

$fixedCount = 0;
foreach ($sales as $sale) {
    // try to find branch from InventoryMovement
    $movement = App\Models\Inventory\InventoryMovement::where('reference_type', 'sale')
                ->where('reference_id', $sale->id)
                ->first();
                
    if ($movement) {
        $sale->branch_id = $movement->branch_id;
        $sale->save();
        $fixedCount++;
        continue;
    }
    
    // try from StockReservation
    $reservation = App\Models\Inventory\StockReservation::where('sale_id', $sale->id)->first();
    if ($reservation) {
        $sale->branch_id = $reservation->branch_id;
        $sale->save();
        $fixedCount++;
        continue;
    }
    
    // try from delivery schedule reference type in movements
    $schedule = App\Models\Logistics\DeliverySchedule::whereHas('shipment', function($q) use ($sale) {
        $q->where('sale_id', $sale->id);
    })->first();
    
    if ($schedule) {
        $movement2 = App\Models\Inventory\InventoryMovement::where('reference_type', 'delivery_schedule')
                ->where('reference_id', $schedule->id)
                ->first();
        if ($movement2) {
            $sale->branch_id = $movement2->branch_id;
            $sale->save();
            $fixedCount++;
        }
    }
}

echo "Fixed " . $fixedCount . " sales.\n";
