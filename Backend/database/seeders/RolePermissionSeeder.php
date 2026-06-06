<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\Core\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Limpiar caché de roles y permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Lista de Permisos a crear
        $permissions = [
            // Usuarios
            'view_users',
            'create_users',
            'edit_users',
            'delete_users',
            'restore_users',

            // Sucursales
            'view_branches',
            'create_branches',
            'edit_branches',
            'delete_branches',
            'restore_branches',

            // Productos
            'view_products',
            'create_products',
            'edit_products',
            'delete_products',
            'restore_products',

            // Roles y Permisos
            'manage_roles',

            // Inventario
            'view_inventory',
            'manage_inventory',

            // Configuraciones Generales
            'manage_settings',
        ];

        // Crear los permisos si no existen
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Crear Roles
        $ownerRole = Role::firstOrCreate(['name' => 'Owner', 'guard_name' => 'web']);
        $adminRole = Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        $sellerRole = Role::firstOrCreate(['name' => 'Vendedor', 'guard_name' => 'web']);

        // Asignar TODO a Owner
        $ownerRole->syncPermissions(Permission::all());

        // Asignar al Administrador (casi todo, menos manage_roles y restore/force deletes si quisieramos limitarlo, 
        // pero por ahora le damos todo menos manage_roles)
        $adminPermissions = Permission::where('name', '!=', 'manage_roles')->get();
        $adminRole->syncPermissions($adminPermissions);

        // Asignar al Vendedor (solo ver)
        $sellerRole->syncPermissions([
            'view_users',
            'view_branches',
            'view_products',
            'view_inventory',
        ]);

        // Opcional: Asignar rol Owner al primer usuario existente para no bloquearnos
        $user = User::first();
        if ($user) {
            $user->assignRole('Owner');
        }
    }
}
