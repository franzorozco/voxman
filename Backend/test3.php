<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$result = \Illuminate\Support\Facades\DB::select("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'chk_addresses_owner'");
print_r($result);
