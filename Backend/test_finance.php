<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ctrl = new App\Http\Controllers\Api\Admin\FinanceDashboardController();
$req = new Illuminate\Http\Request();
$res = $ctrl->index($req);

echo json_encode($res->getData(), JSON_PRETTY_PRINT);
