<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            [
                'key'          => 'home_show_top_bars',
                'display_name' => 'Mostrar Top Bars',
                'value'        => 'true',
                'type'         => 'boolean',
                'description'  => 'Activa o desactiva todos los cintillos de anuncios del Home.',
                'category'     => 'home_config',
            ],
            [
                'key'          => 'home_top_bars',
                'display_name' => 'Cintillos de Anuncios',
                'value'        => '[]',
                'type'         => 'json',
                'description'  => 'Array JSON con la configuracion de cada cintillo (texto, colores, posicion, link).',
                'category'     => 'home_config',
            ],
            // Settings added after initial migration
            [
                'key'          => 'home_show_carousel',
                'display_name' => 'Mostrar Carrusel',
                'value'        => 'true',
                'type'         => 'boolean',
                'description'  => 'Mostrar u ocultar el carrusel dinamico de productos.',
                'category'     => 'home_config',
            ],
            [
                'key'          => 'home_show_value_props',
                'display_name' => 'Mostrar Beneficios',
                'value'        => 'true',
                'type'         => 'boolean',
                'description'  => 'Mostrar u ocultar la barra de beneficios/propuestas de valor.',
                'category'     => 'home_config',
            ],
            [
                'key'          => 'home_featured_categories',
                'display_name' => 'Categorias Destacadas',
                'value'        => '[]',
                'type'         => 'json',
                'description'  => 'Array JSON con las categorias destacadas del Home (max 5).',
                'category'     => 'home_config',
            ],
            [
                'key'          => 'home_value_props',
                'display_name' => 'Propuestas de Valor',
                'value'        => '[]',
                'type'         => 'json',
                'description'  => 'Array JSON con los iconos/textos de la barra de beneficios.',
                'category'     => 'home_config',
            ],
            [
                'key'          => 'home_value_props_bg',
                'display_name' => 'Fondo de Beneficios',
                'value'        => '',
                'type'         => 'string',
                'description'  => 'URL de la imagen de fondo de la seccion de beneficios (parallax).',
                'category'     => 'home_config',
            ],
        ];

        foreach ($settings as $s) {
            if (!DB::table('system_settings')->where('key', $s['key'])->exists()) {
                DB::table('system_settings')->insert(array_merge($s, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }

    public function down(): void
    {
        DB::table('system_settings')->whereIn('key', [
            'home_show_top_bars',
            'home_top_bars',
            'home_show_carousel',
            'home_show_value_props',
            'home_featured_categories',
            'home_value_props',
            'home_value_props_bg',
        ])->delete();
    }
};
