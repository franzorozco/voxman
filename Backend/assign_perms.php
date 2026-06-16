<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$perms = [
    'view_purchases', 'create_purchases', 'cancel_purchases'
];

foreach($perms as $p) {
    Spatie\Permission\Models\Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
    Spatie\Permission\Models\Permission::firstOrCreate(['name' => $p, 'guard_name' => 'api']);
}

$role = Spatie\Permission\Models\Role::where('name', 'Administrador')->first();
if($role) {
    $role->givePermissionTo($perms);
    echo "Permisos de compras asignados al Administrador.\n";
} else {
    echo "No se encontro el rol Administrador.\n";
}
