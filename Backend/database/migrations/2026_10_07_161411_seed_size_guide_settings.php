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
        $defaultGarments = [
            [
                "id" => "tops_long",
                "title" => "TOPS MANGA LARGA (Polerones, Hoodies, Chaquetas)",
                "image" => "/assets/img/guia-tallas/top.jpg",
                "description" => "Coloca tu prenda favorita en una superficie plana y mide de extremo a extremo.",
                "visible" => true,
                "order" => 1,
                "labels" => [
                    [ "text" => "Largo", "top" => 40, "left" => 10, "className" => "label-largo-top" ],
                    [ "text" => "Ancho\n(Pecho)", "top" => 45, "left" => 50, "className" => "label-ancho-top" ],
                    [ "text" => "Largo de\nManga", "top" => 35, "left" => 85, "className" => "label-manga-top" ]
                ]
            ],
            [
                "id" => "tops_short",
                "title" => "TOPS MANGA CORTA (Camisas, Polos, Poleras)",
                "image" => "/assets/img/guia-tallas/short_sleeve.jpg",
                "description" => "Mide el ancho de hombro a hombro, el pecho de axila a axila y el largo total.",
                "visible" => true,
                "order" => 2,
                "labels" => [
                    [ "text" => "Hombro", "top" => 20, "left" => 50, "className" => "label-hombro-short" ],
                    [ "text" => "Ancho\n(Pecho)", "top" => 45, "left" => 50, "className" => "label-ancho-short" ],
                    [ "text" => "Largo", "top" => 50, "left" => 10, "className" => "label-largo-short" ],
                    [ "text" => "Manga", "top" => 30, "left" => 85, "className" => "label-manga-short" ]
                ]
            ],
            [
                "id" => "bottoms",
                "title" => "BOTTOMS (Pantalones, Jeans, Shorts)",
                "image" => "/assets/img/guia-tallas/bottom.jpg",
                "description" => "Mide la cintura de lado a lado y el largo exterior desde la cintura al tobillo.",
                "visible" => true,
                "order" => 3,
                "labels" => [
                    [ "text" => "Cintura", "top" => 8, "left" => 50, "className" => "label-cintura-bot" ],
                    [ "text" => "Tiro", "top" => 25, "left" => 80, "className" => "label-tiro-bot" ],
                    [ "text" => "Largo\nTotal", "top" => 50, "left" => 10, "className" => "label-largo-bot" ]
                ]
            ],
            [
                "id" => "hats",
                "title" => "ACCESORIOS (Gorros, Sombreros)",
                "image" => "/assets/img/guia-tallas/hat.jpg",
                "description" => "Mide el contorno de tu cabeza a la altura de la frente.",
                "visible" => true,
                "order" => 4,
                "labels" => [
                    [ "text" => "Circunferencia", "top" => 55, "left" => 15, "className" => "label-circ-hat" ],
                    [ "text" => "Alto", "top" => 40, "left" => 85, "className" => "label-alto-hat" ]
                ]
            ],
            [
                "id" => "watches",
                "title" => "RELOJES",
                "image" => "/assets/img/guia-tallas/watch.jpg",
                "description" => "El diámetro de la caja te dará una idea de qué tan grande se verá en tu muñeca.",
                "visible" => true,
                "order" => 5,
                "labels" => [
                    [ "text" => "Diámetro\nCaja", "top" => 15, "left" => 50, "className" => "label-diametro-watch" ],
                    [ "text" => "Largo Total\n(Correa)", "top" => 70, "left" => 30, "className" => "label-largo-watch" ]
                ]
            ]
        ];

        $keys = ['size_page_garments', 'size_page_title', 'size_page_subtitle'];
        $existing = DB::table('system_settings')->whereIn('key', $keys)->pluck('key')->toArray();

        if (!in_array('size_page_garments', $existing)) {
            DB::table('system_settings')->insert([
                'key' => 'size_page_garments',
                'display_name' => 'Prendas de Guía de Tallas',
                'value' => json_encode($defaultGarments, JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'category' => 'size_page_config',
                'description' => 'Configuración de imágenes y etiquetas para la guía de tallas',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (!in_array('size_page_title', $existing)) {
            DB::table('system_settings')->insert([
                'key' => 'size_page_title',
                'display_name' => 'Título de Guía de Tallas',
                'value' => 'GUÍA DE TALLAS',
                'type' => 'string',
                'category' => 'size_page_config',
                'description' => 'Título principal de la página',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (!in_array('size_page_subtitle', $existing)) {
            DB::table('system_settings')->insert([
                'key' => 'size_page_subtitle',
                'display_name' => 'Subtítulo de Guía de Tallas',
                'value' => 'Cada una de nuestras prendas tiene un corte y caída únicos según su diseño. A continuación, te mostramos cómo medimos nuestras prendas para que puedas compararlas con tu ropa favorita y encontrar tu fit ideal.',
                'type' => 'string',
                'category' => 'size_page_config',
                'description' => 'Texto descriptivo debajo del título',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')->whereIn('key', [
            'size_page_garments',
            'size_page_title',
            'size_page_subtitle'
        ])->delete();
    }
};
