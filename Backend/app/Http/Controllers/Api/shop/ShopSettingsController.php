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
            'delivery_pickup', 'delivery_home', 'delivery_scheduled_point', 'delivery_national'
        ];
        
        $settings = SystemSetting::whereIn('key', $keys)
            ->pluck('value', 'key');
            
        return response()->json($settings);
    }
}
