<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $req = new \Illuminate\Http\Request();
    $req->merge(['search'=>'', 'status'=>'', 'date_from'=>'', 'date_to'=>'']);
    $c = app('App\Http\Controllers\Api\Admin\ReturnController');
    $response = $c->index($req);
    $content = $response->getContent();
    echo "OK. Length: " . strlen($content);
} catch (\Exception $e) {
    echo $e->getMessage() . "\n" . $e->getFile() . " on line " . $e->getLine();
}
