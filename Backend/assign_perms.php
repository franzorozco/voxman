<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$perms = [
    'view_promotions', 'create_promotions', 'edit_promotions', 'delete_promotions', 'restore_promotions',
    'view_giftcards', 'create_giftcards', 'edit_giftcards', 'delete_giftcards', 'restore_giftcards'
];

foreach($perms as $p) {
    Spatie\Permission\Models\Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
    Spatie\Permission\Models\Permission::firstOrCreate(['name' => $p, 'guard_name' => 'api']);
}

$role = Spatie\Permission\Models\Role::where('name', 'Administrador')->first();
if($role) {
    // We give permission using the default guard for the role
    $role->givePermissionTo($perms);
    echo "Permisos asignados al Administrador.\n";
} else {
    echo "No se encontro el rol Administrador.\n";
}
