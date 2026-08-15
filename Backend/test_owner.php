<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$controller = app('App\Http\Controllers\Api\Admin\OwnerController');
$res = $controller->index();
echo json_encode($res->toArray(), JSON_PRETTY_PRINT);
