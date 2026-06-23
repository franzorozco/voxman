<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = new App\Http\Controllers\Api\Admin\FinanceDashboardController();
$res = $controller->ownerLedger('e3eb807f-9267-46d7-a568-8490faa735b5');
print_r($res->getData(true));
