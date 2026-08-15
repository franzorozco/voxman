<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$userId = 'e5ec9b6e-2d7a-4834-b6f6-23d95120e027';
$user = App\Models\Core\User::find($userId);

if ($user) {
    // Remove Vendedor role
    if ($user->hasRole('Vendedor')) {
        $user->removeRole('Vendedor');
        echo "Removed 'Vendedor' role.\n";
    }
    
    // Assign Administrador role
    if (!$user->hasRole('Administrador')) {
        $user->assignRole('Administrador');
        echo "Assigned 'Administrador' role.\n";
    }
    
    // Assign Owner role just in case
    if (!$user->hasRole('Owner')) {
        $user->assignRole('Owner');
        echo "Assigned 'Owner' role.\n";
    }
    
    echo "Done! Current roles: " . $user->roles->pluck('name')->implode(', ') . "\n";
} else {
    echo "User not found.\n";
}
