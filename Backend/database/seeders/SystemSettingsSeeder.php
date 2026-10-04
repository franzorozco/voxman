<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'whatsapp_orders',
                'display_name' => 'Número de WhatsApp para Pedidos',
                'value' => '+591 57003312',
                'type' => 'string',
                'description' => 'Número oficial para recibir pedidos de la tienda online',
            ],
            [
                'key' => 'contact_email',
                'display_name' => 'Correo de Contacto',
                'value' => 'contacto@voxman.bo',
                'type' => 'string',
                'description' => 'Correo electrónico oficial de atención al cliente',
            ],
            [
                'key' => 'facebook_url',
                'display_name' => 'Facebook URL',
                'value' => 'https://facebook.com/voxman',
                'type' => 'string',
                'description' => 'Enlace a la página oficial de Facebook',
            ],
            [
                'key' => 'instagram_url',
                'display_name' => 'Instagram URL',
                'value' => 'https://instagram.com/voxman',
                'type' => 'string',
                'description' => 'Enlace al perfil oficial de Instagram',
            ],
            [
                'key' => 'tiktok_url',
                'display_name' => 'TikTok URL',
                'value' => 'https://tiktok.com/@voxman',
                'type' => 'string',
                'description' => 'Enlace al perfil oficial de TikTok',
            ],
            [
                'key' => 'store_address',
                'display_name' => 'Dirección de la Tienda Principal',
                'value' => 'Av. Principal #123, Ciudad',
                'type' => 'string',
                'description' => 'Dirección física de la tienda principal',
            ],
            [
                'key' => 'shipping_fee',
                'display_name' => 'Costo de Envío Estándar',
                'value' => '20',
                'type' => 'integer',
                'description' => 'Costo base de envío estándar',
            ],
            [
                'key' => 'free_shipping_threshold',
                'display_name' => 'Monto para Envío Gratis',
                'value' => '500',
                'type' => 'integer',
                'description' => 'Monto mínimo en el carrito para que el envío sea gratuito',
            ],
            [
                'key' => 'maintenance_mode',
                'display_name' => 'Modo Mantenimiento',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Activar modo mantenimiento (true/false)',
            ]
        ];

        foreach ($settings as $setting) {
            \App\Models\System\SystemSetting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'display_name' => $setting['display_name'],
                    'value' => $setting['value'],
                    'type' => $setting['type'],
                    'description' => $setting['description'],
                ]
            );
        }
    }
}
