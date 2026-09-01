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
        DB::table('system_settings')->insert([
            [
                'key' => 'delivery_pickup',
                'display_name' => 'Recojo en Sucursal',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'Entregas',
                'description' => 'Habilitar o deshabilitar la opción de recojo en sucursal física',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'delivery_home',
                'display_name' => 'Entrega a Domicilio',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'Entregas',
                'description' => 'Habilitar o deshabilitar los envíos a domicilio (Delivery local)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'delivery_scheduled_point',
                'display_name' => 'Entrega en Punto de Encuentro',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'Entregas',
                'description' => 'Habilitar o deshabilitar entregas en puntos estratégicos programados',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'delivery_national',
                'display_name' => 'Envío a Nivel Nacional',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'Entregas',
                'description' => 'Habilitar o deshabilitar envíos nacionales (flota, correos, etc.)',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')->whereIn('key', [
            'delivery_pickup',
            'delivery_home',
            'delivery_scheduled_point',
            'delivery_national'
        ])->delete();
    }
};
