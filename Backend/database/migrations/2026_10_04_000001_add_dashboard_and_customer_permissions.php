<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Seguridad de /dashboard, /dashboard/giftcards y clientes:
 *  - Crea el permiso de acceso al panel (access_dashboard) y los permisos de clientes.
 *  - Los asigna a los roles de staff (los clientes públicos NO lo reciben).
 *  - Quita los permisos de giftcards al rol "Usuario" (rol que reciben TODOS los registros públicos).
 * Es idempotente: se puede ejecutar varias veces sin duplicar nada.
 */
return new class extends Migration
{
    private const NEW_PERMISSIONS = [
        'access_dashboard',
        'view_customers', 'create_customers', 'edit_customers', 'delete_customers', 'restore_customers',
        'adjust_loyalty_points',
    ];

    private const GIFT = ['view_giftcards', 'create_giftcards', 'edit_giftcards', 'delete_giftcards', 'restore_giftcards'];
    private const CUSTOMER_ALL = ['view_customers', 'create_customers', 'edit_customers', 'delete_customers', 'restore_customers', 'adjust_loyalty_points', 'view_loyalty_points'];

    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::NEW_PERMISSIONS as $name) {
            Permission::findOrCreate($name, 'web');
        }

        $grants = [
            'Owner'                => array_merge(['access_dashboard'], self::CUSTOMER_ALL, self::GIFT),
            'Administrador'        => array_merge(['access_dashboard'], self::CUSTOMER_ALL, self::GIFT),
            'Gerente de Sucursal'  => array_merge(['access_dashboard', 'view_customers', 'create_customers', 'edit_customers', 'view_loyalty_points'], ['view_giftcards', 'create_giftcards', 'edit_giftcards']),
            'Vendedor'             => ['access_dashboard', 'view_customers', 'create_customers', 'edit_customers', 'view_giftcards', 'create_giftcards'],
            'Encargado de sucursal'=> ['access_dashboard'],
            'Almacenista'          => ['access_dashboard'],
            'Repartidor'           => ['access_dashboard'],
        ];

        foreach ($grants as $roleName => $perms) {
            $role = Role::where('name', $roleName)->where('guard_name', 'web')->first();
            if (!$role) continue;
            foreach ($perms as $p) {
                $role->givePermissionTo(Permission::findOrCreate($p, 'web'));
            }
        }

        // Los registros públicos reciben el rol "Usuario": NO debe tener ningún permiso de gestión.
        $usuario = Role::where('name', 'Usuario')->where('guard_name', 'web')->first();
        if ($usuario) {
            foreach (self::GIFT as $p) {
                $perm = Permission::where('name', $p)->where('guard_name', 'web')->first();
                if ($perm) $usuario->revokePermissionTo($perm);
            }
        }

        // Permisos directos de giftcards en cuentas que no son staff (por si se asignaron a mano)
        $staffRoleIds = Role::whereIn('name', array_keys($grants))->pluck('id');
        $giftPermIds  = Permission::whereIn('name', self::GIFT)->pluck('id');
        $staffUsers   = DB::table('model_has_roles')->whereIn('role_id', $staffRoleIds)->pluck('model_id');
        DB::table('model_has_permissions')
            ->whereIn('permission_id', $giftPermIds)
            ->whereNotIn('model_id', $staffUsers)
            ->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        Permission::whereIn('name', self::NEW_PERMISSIONS)->where('guard_name', 'web')->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
