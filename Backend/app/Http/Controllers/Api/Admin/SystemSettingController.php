<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\System\SystemSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SystemSettingController extends Controller
{
    public function index()
    {
        $settings = SystemSetting::all();
        return response()->json($settings);
    }

    public function update(Request $request, $key)
    {
        $setting = SystemSetting::where('key', $key)->first();

        if (!$setting) {
            $cat = 'General';
            if (str_starts_with($key, 'shop_home_')) $cat = 'Shop_page';
            elseif (str_starts_with($key, 'home_')) $cat = 'home_config';
            elseif (str_starts_with($key, 'shipping_')) $cat = 'shipping_page_config';
            
            $type = str_contains($key, 'images') || str_contains($key, 'categories') || str_contains($key, 'props') ? 'json' : 'string';
            
            $setting = SystemSetting::create([
                'key' => $key,
                'display_name' => ucwords(str_replace('_', ' ', $key)),
                'value' => '',
                'type' => $type,
                'category' => $cat,
                'description' => ''
            ]);
        }

        if ($request->hasFile('value_file')) {
            $file = $request->file('value_file');

            $folder = 'system/settings';
            if (str_contains($key, 'logo')) {
                $folder = 'system/logos';
            } elseif (str_contains($key, 'favicon')) {
                $folder = 'system/favicons';
            } elseif ($key === 'payment_qr') {
                $folder = 'system/payments';
            }

            // Extensión determinada por el contenido real (lista blanca de imágenes), no por el cliente
            $ext      = \App\Support\SecureUpload::validate($file, 'image', 'value_file');
            $filename = Str::uuid() . '.' . $ext;

            try {
                // Use put() with raw contents — avoids x-amz-acl headers that R2 rejects
                $fullPath = $folder . '/' . $filename;
                $contents = file_get_contents($file->getRealPath());
                $result = \Illuminate\Support\Facades\Storage::disk('s3')->put($fullPath, $contents);

                if (!$result) {
                    Log::error('[SystemSetting] put() returned false — upload failed silently');
                    
        // Invalidar caché público cuando se modifican las configuraciones
        \Illuminate\Support\Facades\Cache::forget('public_shop_settings');
        \Illuminate\Support\Facades\Cache::forget('shop_featured_categories');

        return response()->json(['message' => 'Error al subir imagen al almacenamiento'], 500);
                }

                Log::info('[SystemSetting] uploaded to S3', ['path' => $fullPath]);
                $setting->update(['value' => $fullPath]);

            } catch (\Exception $e) {
                Log::error('[SystemSetting] S3 upload exception: ' . $e->getMessage());
                
        // Invalidar caché público cuando se modifican las configuraciones
        \Illuminate\Support\Facades\Cache::forget('public_shop_settings');
        \Illuminate\Support\Facades\Cache::forget('shop_featured_categories');

        return response()->json(['message' => 'Error al subir el archivo'], 500);
            }

        } else {
            $request->validate([
                'value'       => 'nullable|string',
                'description' => 'nullable|string',
            ]);

            $setting->update([
                'value'       => $request->value,
                'description' => $request->description ?? $setting->description,
            ]);
        }

        
        // Invalidar caché público cuando se modifican las configuraciones
        \Illuminate\Support\Facades\Cache::forget('public_shop_settings');
        \Illuminate\Support\Facades\Cache::forget('shop_featured_categories');

        return response()->json([
            'message' => 'Configuración actualizada correctamente',
            'setting' => $setting->fresh(),
        ]);
    }
}

