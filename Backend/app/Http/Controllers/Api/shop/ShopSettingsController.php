<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\System\SystemSetting;

class ShopSettingsController extends Controller
{
    public function index()
    {
        // ⚠️ WHITELIST EXPLÍCITA: Solo se exponen estas keys al frontend público.
        // No usar patrones LIKE para evitar exponer settings sensibles futuros.
        $allowedKeys = [
            // Tienda general
            'store_logo', 'store_logo_dark', 'store_logo_light', 'payment_qr',
            'store_name', 'store_phone', 'store_address',
            'facebook_url', 'instagram_url', 'tiktok_url', 'contact_email',

            // Métodos de entrega
            'delivery_pickup', 'delivery_home', 'delivery_scheduled_point', 'delivery_national',

            // Home config
            'home_show_hero', 'home_show_categories', 'home_show_newsletter',
            'home_hero_title', 'home_hero_subtitle', 'home_hero_images',
            'home_show_carousel', 'home_carousel_title', 'home_carousel_type',
            'home_show_value_props', 'home_value_props', 'home_value_props_bg',
            'home_show_top_bars', 'home_top_bars',
        ];

        // Keys de shop_home_ y catalog_ se administran explícitamente en DB,
        // así que sí las incluimos — pero solo con prefijos conocidos y controlados.
        $settings = \App\Models\System\SystemSetting::where(function ($q) use ($allowedKeys) {
                $q->whereIn('key', $allowedKeys)
                  ->orWhere(function ($q2) {
                      // Solo sub-prefijos específicos permitidos
                      $q2->where('key', 'like', 'shipping_%')
                         ->orWhere('key', 'like', 'about_%')
                         ->orWhere('key', 'like', 'shop_home_%')
                         ->orWhere('key', 'like', 'catalog_%');
                  });
            })
            // Nunca exponer keys sensibles aunque coincidan con los patrones
            ->whereNotIn('key', [
                'app_key', 'jwt_secret', 'stripe_key', 'stripe_secret',
                'aws_key', 'aws_secret', 'mail_password', 'db_password',
            ])
            ->pluck('value', 'key');

        return response()->json($settings);
    }
}
