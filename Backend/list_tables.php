<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$tables = \DB::select("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
foreach($tables as $t) echo $t->tablename . PHP_EOL;
