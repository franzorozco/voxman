<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$method = new ReflectionMethod('App\Http\Controllers\Api\Admin\ExpenseController', 'getTreasuryBalance');
$method->setAccessible(true);
$controller = app('App\Http\Controllers\Api\Admin\ExpenseController');

$branches = App\Models\Branch\Branch::all();
foreach ($branches as $branch) {
    $cash = $method->invokeArgs($controller, ['cash', $branch->id]);
    $bank = $method->invokeArgs($controller, ['bank', $branch->id]);
    echo "Branch {$branch->name}: Cash: {$cash}, Bank: {$bank}\n";
}
