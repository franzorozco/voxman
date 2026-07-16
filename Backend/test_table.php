<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    DB::statement('SELECT 1 FROM pos_customer_profiles');
    echo "TABLE_EXISTS";
} catch (\Exception $e) {
    echo "TABLE_MISSING: " . $e->getMessage();
}
