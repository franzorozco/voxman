<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$role = App\Models\Auth\Role::with('permissions')->where('name', 'Vendedor')->first();
if ($role) {
    echo "Vendedor perms: " . $role->permissions->pluck('name')->implode(', ');
} else {
    echo "Role not found";
}
