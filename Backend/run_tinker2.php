<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
\App\Models\System\SystemSetting::updateOrCreate(
    ['key' => 'home_value_props_bg'],
    ['value' => 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/funds/proximamente.jpg', 'group' => 'home_config', 'type' => 'string']
);
echo "Done\n";
