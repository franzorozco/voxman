<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$owner = App\Models\Finance\Owner::where('id', 'e3eb807f-9267-46d7-a568-8490faa735b5')->first();
$sales = App\Models\Finance\SaleDetail::with('sale.payments')->whereHas('sale', function($q) {
    $q->where('status', 'paid');
})->where('owner_id', $owner->id)->get();

foreach($sales as $s) {
    echo "Sale date: " . $s->sale->sale_date . " | strtotime: " . strtotime($s->sale->sale_date) . "\n";
}
