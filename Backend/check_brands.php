<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$cols = DB::select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='brands'");
print_r($cols);
