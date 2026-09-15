<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\System\SystemSetting;

class ShopSettingsController extends Controller
{
    public function index()
    {
        // Solo devolver configuraciones públicas para el frontend
        $keys = [
            'store_logo', 'store_logo_dark', 'store_logo_light', 'payment_qr',
            'store_name', 'store_phone', 'store_address', 'facebook_url', 'instagram_url',
            'tiktok_url', 'contact_email',
            'delivery_pickup', 'delivery_home', 'delivery_scheduled_point', 'delivery_national',
            // Home config
            'home_show_hero', 'home_show_categories', 'home_show_newsletter',
            'home_hero_title', 'home_hero_subtitle', 'home_hero_images',
            'home_show_carousel', 'home_carousel_title', 'home_carousel_type',
            'home_show_value_props', 'home_value_props', 'home_value_props_bg',
        ];

        $settings = SystemSetting::whereIn('key', $keys)
            ->pluck('value', 'key');

        return response()->json($settings);
    }
}
