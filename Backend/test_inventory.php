<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$query = App\Models\Inventory\Inventory::with([
    'branch',
    'variant.product.product_images',
    'variant.product.category',
    'variant.variant_images',
    'variant.variant_attribute_values.attribute_value.attribute'
]);

echo json_encode($query->get());
