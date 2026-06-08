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
            'manage_user_roles',
            'manage_user_salaries',
            'manage_executives',

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
            'view_product_costs',
            'manage_product_pricing',
            'manage_discounts',
            'publish_products',
            'manage_product_measurements', // NUEVO

            // Categorias
            'view_categories',
            'create_categories',
            'edit_categories',
            'delete_categories',

            // Settings - Catálogo
            'view_settings_categories',
            'view_settings_product_types',
            'view_settings_attributes',
            'view_settings_sizes',
            'view_settings_fits',
            'view_settings_measurements',
            'view_settings_brands',
            
            'edit_settings_categories',
            'edit_settings_product_types',
            'edit_settings_attributes',
            'edit_settings_sizes',
            'edit_settings_fits',
            'edit_settings_measurements',
            'edit_settings_brands',

            // Roles y Permisos
            'manage_roles',

            // Inventario (NUEVOS)
            'view_inventory_own_branch',
            'view_inventory_all_branches',
            'adjust_inventory',
            'transfer_inventory',
            'receive_inventory',
            'view_inventory_history',
            'inventory_mass_entry',

            // Configuraciones Generales
            'manage_settings',
        ];

        // Crear los permisos si no existen
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Eliminar permisos obsoletos si existen
        $oldPermissions = ['view_inventory', 'manage_inventory'];
        foreach ($oldPermissions as $old) {
            $perm = Permission::where('name', $old)->first();
            if ($perm) {
                $perm->delete();
            }
        }

        // Crear Roles
        $ownerRole = Role::firstOrCreate(['name' => 'Owner', 'guard_name' => 'web']);
        $adminRole = Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        $branchManagerRole = Role::firstOrCreate(['name' => 'Gerente de Sucursal', 'guard_name' => 'web']);
        $warehouseRole = Role::firstOrCreate(['name' => 'Almacenista', 'guard_name' => 'web']);
        $sellerRole = Role::firstOrCreate(['name' => 'Vendedor', 'guard_name' => 'web']);
        $deliveryRole = Role::firstOrCreate(['name' => 'Repartidor', 'guard_name' => 'web']);

        // Asignar TODO a Owner
        $ownerRole->syncPermissions(Permission::all());

        // Asignar al Administrador (casi todo, menos manage_roles)
        $adminPermissions = Permission::where('name', '!=', 'manage_roles')->get();
        $adminRole->syncPermissions($adminPermissions);

        // Gerente de Sucursal
        $branchManagerRole->syncPermissions([
            'view_users',
            'view_products',
            'view_categories',
            'view_branches',
            'view_inventory_own_branch',
            'view_inventory_history',
            'receive_inventory',
            'transfer_inventory',
            'adjust_inventory', // con reservas, pero se lo damos
        ]);

        $warehouseRole->syncPermissions([
            'view_products',
            'create_products',
            'edit_products',
            'manage_product_measurements', // NUEVO
            'view_categories',
            'view_inventory_own_branch',
            'receive_inventory',
            'transfer_inventory',
        ]);

        // Vendedor (solo ver)
        $sellerRole->syncPermissions([
            'view_users',
            'view_branches',
            'view_products',
            'view_categories',
            'view_inventory_own_branch',
            'view_inventory_all_branches', // Opcional, para que puedan ver stock de otras tiendas
        ]);

        // Repartidor
        $deliveryRole->syncPermissions([
            'view_inventory_own_branch',
        ]);

        // Asignar rol Owner explícitamente a franzorozco0@gmail.com
        $superAdmin = User::where('email', 'ftanzorozco0@gmail.com')->first();
        if ($superAdmin) {
            $superAdmin->assignRole('Owner');
        } else {
            // Fallback si el email no coincide, asignar al primer usuario
            $user = User::first();
            if ($user) {
                $user->assignRole('Owner');
            }
        }
    }
}
