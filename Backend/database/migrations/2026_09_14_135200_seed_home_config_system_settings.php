<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            ['key' => 'home_show_hero',       'display_name' => 'Mostrar Hero',         'value' => 'true',  'type' => 'boolean', 'description' => 'Mostrar u ocultar la seccion principal (Hero).', 'category' => 'home_config'],
            ['key' => 'home_show_featured',   'display_name' => 'Mostrar Destacados',   'value' => 'true',  'type' => 'boolean', 'description' => 'Mostrar u ocultar la seccion de productos destacados.', 'category' => 'home_config'],
            ['key' => 'home_show_categories', 'display_name' => 'Mostrar Categorias',   'value' => 'true',  'type' => 'boolean', 'description' => 'Mostrar u ocultar la seccion de categorias.', 'category' => 'home_config'],
            ['key' => 'home_show_newsletter', 'display_name' => 'Mostrar Newsletter',   'value' => 'true',  'type' => 'boolean', 'description' => 'Mostrar u ocultar el bloque de suscripcion.', 'category' => 'home_config'],
            ['key' => 'home_hero_title',      'display_name' => 'Titulo del Hero',      'value' => 'VOXman','type' => 'string',  'description' => 'Titulo principal sobre las imagenes del hero.', 'category' => 'home_config'],
            ['key' => 'home_hero_subtitle',   'display_name' => 'Subtitulo del Hero',   'value' => 'Estilo masculino moderno, minimalista y potente.', 'type' => 'string', 'description' => 'Subtitulo debajo del titulo del hero.', 'category' => 'home_config'],
            ['key' => 'home_hero_images',     'display_name' => 'Imagenes del Hero',    'value' => '[]',    'type' => 'json',    'description' => 'Array JSON con las URLs de las imagenes del hero (max 4).', 'category' => 'home_config'],
        ];

        foreach ($settings as $s) {
            if (!DB::table('system_settings')->where('key', $s['key'])->exists()) {
                DB::table('system_settings')->insert(array_merge($s, ['created_at' => now(), 'updated_at' => now()]));
            }
        }
    }

    public function down(): void
    {
        DB::table('system_settings')->whereIn('key', [
            'home_show_hero','home_show_featured','home_show_categories',
            'home_show_newsletter','home_hero_title','home_hero_subtitle','home_hero_images',
        ])->delete();
    }
};
