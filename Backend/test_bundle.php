<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$product = App\Models\Catalog\Product::with([
    'bundle_items.product.inventories', 
    'bundle_items.product.product_variants.inventories', 
    'bundle_items.variant.inventories'
])->where('is_bundle', true)->first();

echo "Bundle ID: " . $product->id . "\n";
foreach ($product->bundle_items as $bi) {
    echo "Item: " . ($bi->product ? $bi->product->name : 'N/A') . "\n";
    echo "Requires Variant ID: " . ($bi->variant_id ?: 'None') . "\n";
    if ($bi->variant_id) {
        $v = $bi->variant;
        if ($v) {
            echo "Variant Loaded! Inventories: " . $v->inventories->sum('stock') . "\n";
        } else {
            echo "Variant NOT loaded via relation! Checking product->product_variants...\n";
            $v2 = $bi->product->product_variants->firstWhere('id', $bi->variant_id);
            if ($v2) {
                echo "Found in product_variants! Inventories: " . $v2->inventories->sum('stock') . "\n";
            } else {
                echo "NOT FOUND IN PRODUCT VARIANTS EITHER!\n";
            }
        }
    } else {
        $stock = $bi->product->inventories->sum('stock');
        foreach ($bi->product->product_variants as $v) {
            $stock += $v->inventories->sum('stock');
        }
        echo "Total Stock for Product: " . $stock . "\n";
    }
}
