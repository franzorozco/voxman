<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            $table->string('category')->default('General')->after('description');
        });

        // 1. Delete shipping_fee, free_shipping_threshold, store_logo
        DB::table('system_settings')->whereIn('key', [
            'shipping_fee', 
            'free_shipping_threshold', 
            'store_logo'
        ])->delete();

        // 2. Add the new ones
        DB::table('system_settings')->insert([
            [
                'key' => 'store_logo_light',
                'display_name' => 'Logo Principal (Modo Claro)',
                'value' => '',
                'type' => 'image',
                'category' => 'Apariencia',
                'description' => 'Logo de la tienda para fondos claros',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'store_logo_dark',
                'display_name' => 'Logo Principal (Modo Oscuro)',
                'value' => '',
                'type' => 'image',
                'category' => 'Apariencia',
                'description' => 'Logo de la tienda para fondos oscuros',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'favicon_light',
                'display_name' => 'Favicon (Modo Claro)',
                'value' => '',
                'type' => 'image',
                'category' => 'Apariencia',
                'description' => 'Icono pequeño de la pestaña para temas claros',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'favicon_dark',
                'display_name' => 'Favicon (Modo Oscuro)',
                'value' => '',
                'type' => 'image',
                'category' => 'Apariencia',
                'description' => 'Icono pequeño de la pestaña para temas oscuros',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 3. Categorize the rest
        DB::table('system_settings')->whereIn('key', ['store_name', 'store_address', 'store_phone', 'contact_email'])->update(['category' => 'General']);
        DB::table('system_settings')->whereIn('key', ['facebook_url', 'instagram_url', 'tiktok_url'])->update(['category' => 'Redes Sociales']);
        DB::table('system_settings')->whereIn('key', ['whatsapp_orders', 'payment_qr'])->update(['category' => 'Pagos y Pedidos']);
        DB::table('system_settings')->whereIn('key', ['maintenance_mode'])->update(['category' => 'Avanzado']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
