<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$columns = \DB::select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shipment_tracking'");
foreach($columns as $c) echo $c->column_name . ' (' . $c->data_type . ')' . PHP_EOL;
