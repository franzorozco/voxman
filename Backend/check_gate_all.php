<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$roles = App\Models\Auth\Role::with('users')->get();
foreach ($roles as $r) {
    echo "Role: " . $r->name . "\n";
    $firstUser = $r->users->first();
    if ($firstUser) {
        echo "  Sample User ID: " . $firstUser->id . "\n";
        echo "  Has manage_roles? " . ($firstUser->can('manage_roles') ? 'YES' : 'NO') . "\n";
        echo "  Has view_finance? " . ($firstUser->can('view_finance') ? 'YES' : 'NO') . "\n";
    }
}
