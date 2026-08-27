<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;

$columns = Schema::getColumnListing('system_settings');
print_r($columns);

use Illuminate\Support\Facades\DB;
$settings = DB::table('system_settings')->get();
foreach($settings as $s) {
    echo $s->key . ' | ' . $s->display_name . "\n";
}
