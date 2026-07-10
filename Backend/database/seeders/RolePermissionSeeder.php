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

            // Proveedores
            'view_suppliers',
            'create_suppliers',
            'edit_suppliers',
            'delete_suppliers',
            'restore_suppliers',

            // Compras (Abastecimiento)
            'view_purchases',
            'create_purchases',
            'cancel_purchases',

            // Promociones
            'view_promotions',
            'create_promotions',
            'edit_promotions',
            'delete_promotions',
            'restore_promotions',

            // Giftcards
            'view_giftcards',
            'create_giftcards',
            'edit_giftcards',
            'delete_giftcards',
            'restore_giftcards',

            // Ajustes y Configuración
            'manage_settings', // NUEVO

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

            // Finanzas
            'view_finance',
            'manage_expenses',
            'manage_owner_payments',
            'view_cashflow',
            'manage_cashflow',
            'view_finance_reports',

            // Ventas
            'view_sales',
            'view_sales_own_branch',
            'view_sales_all_branches',
            'manage_sales',
            'print_sale_receipt',
            'view_sale_profits',

            // Devoluciones
            'view_returns',
            'view_returns_own_branch',
            'view_returns_all_branches',
            'manage_returns',

            // Carritos y Proformas
            'view_carts',
            'view_carts_own_branch',
            'view_carts_all_branches',
            'manage_carts',
            'delete_carts',

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
        $ownerRole->syncPermissions(Permission::where('guard_name', 'web')->get());

        // Asignar al Administrador (casi todo, menos manage_roles)
        $adminPermissions = Permission::where('guard_name', 'web')->where('name', '!=', 'manage_roles')->get();
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
            'view_sales',
            'view_sales_own_branch',
            'print_sale_receipt',
            'view_returns',
            'view_returns_own_branch',
            'manage_returns',
            'view_carts',
            'view_carts_own_branch',
            'manage_carts',
            'delete_carts',
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
            'view_sales',
            'view_sales_own_branch',
            'print_sale_receipt',
            'view_returns',
            'view_returns_own_branch',
            'manage_returns',
            'view_carts',
            'view_carts_own_branch',
            'manage_carts',
            'delete_carts',
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
