<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$request = \Illuminate\Http\Request::create('/api/v1/admin/finance/expenses', 'POST', [
    'name' => 'Prueba',
    'amount' => 1000,
    'expense_date' => now()->toDateString(),
    'split_type' => 'equal',
    'status' => 'paid',
    'fund_source' => 'cash',
    'branch_id' => App\Models\Branch\Branch::first()->id,
    'deducted_from_wallet' => true
]);

$controller = app('App\Http\Controllers\Api\Admin\ExpenseController');
$response = $controller->store($request);
echo $response->getStatusCode() . "\n";
echo $response->getContent() . "\n";
