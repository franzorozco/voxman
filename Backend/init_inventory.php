<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$variants = App\Models\Catalog\ProductVariant::all();
$branches = App\Models\Branch\Branch::all();

foreach ($variants as $variant) {
    foreach ($branches as $branch) {
        App\Models\Inventory\Inventory::firstOrCreate(
            [
                'variant_id' => $variant->id,
                'branch_id' => $branch->id,
            ],
            [
                'stock' => 0,
                'min_stock' => 5
            ]
        );
    }
}
echo "Inventory initialized.\n";
