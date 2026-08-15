<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$controller = app('App\Http\Controllers\Api\Admin\ReturnController');
// Simulate request
$request = \Illuminate\Http\Request::create('/api/v1/admin/returns', 'GET');
$res = $controller->index($request);
echo json_encode($res, JSON_PRETTY_PRINT);
