<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
try {
    $s = \App\Models\Logistics\Shipment::find('019fa088-cbdb-72ea-8ac0-b65131f2085d');
    $s->status = 'prepared';
    $s->save();
    echo 'OK';
} catch (\Exception $e) {
    echo $e->getMessage();
}
