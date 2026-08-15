<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\Core\User::first();
echo "User roles: " . $user->roles->pluck('name')->implode(', ') . "\n";
echo "Has manage_roles? " . ($user->can('manage_roles') ? 'YES' : 'NO') . "\n";
echo "Has view_finance? " . ($user->can('view_finance') ? 'YES' : 'NO') . "\n";
