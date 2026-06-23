<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Sales\SaleDetail;
use App\Models\Finance\Payment;
use Illuminate\Support\Facades\DB;

$salesRevenue = SaleDetail::whereHas('sale', function($q) {
    $q->where('status', 'paid');
})->sum(DB::raw('subtotal - discount'));

$paymentsTotal = Payment::sum('amount');
$paymentsByMethod = Payment::select('payment_method_id', DB::raw('sum(amount) as total'))
    ->groupBy('payment_method_id')
    ->get();

$methods = \App\Models\Finance\PaymentMethod::all()->keyBy('id');

echo "Total Sales Revenue: $salesRevenue\n";
echo "Total Payments: $paymentsTotal\n";
echo "Payments by Method:\n";
foreach($paymentsByMethod as $p) {
    $methodName = $methods[$p->payment_method_id]->name ?? 'Unknown';
    echo " - $methodName: {$p->total}\n";
}
