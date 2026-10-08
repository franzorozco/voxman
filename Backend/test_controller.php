<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create('/api/v1/shop/products', 'GET');
$controller = new App\Http\Controllers\Api\Shop\ShopProductController();
$response = $controller->index($request);
$data = json_decode($response->getContent(), true);

foreach ($data['data'] as $item) {
    if ($item['is_bundle']) {
        echo "Bundle: " . $item['name'] . "\n";
        echo "in_stock: " . ($item['in_stock'] ? 'true' : 'false') . "\n";
        echo "stock: " . $item['stock'] . "\n";
    }
}
