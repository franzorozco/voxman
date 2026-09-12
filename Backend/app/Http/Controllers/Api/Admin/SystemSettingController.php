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
        $setting = SystemSetting::where('key', $key)->firstOrFail();

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

            $ext      = $file->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $ext;

            try {
                // Use put() with raw contents — avoids x-amz-acl headers that R2 rejects
                $fullPath = $folder . '/' . $filename;
                $contents = file_get_contents($file->getRealPath());
                $result = \Illuminate\Support\Facades\Storage::disk('s3')->put($fullPath, $contents);

                if (!$result) {
                    Log::error('[SystemSetting] put() returned false — upload failed silently');
                    return response()->json(['message' => 'Error al subir imagen al almacenamiento'], 500);
                }

                Log::info('[SystemSetting] uploaded to S3', ['path' => $fullPath]);
                $setting->update(['value' => $fullPath]);

            } catch (\Exception $e) {
                Log::error('[SystemSetting] S3 upload exception: ' . $e->getMessage());
                return response()->json(['message' => 'Error S3: ' . $e->getMessage()], 500);
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

        return response()->json([
            'message' => 'Configuración actualizada correctamente',
            'setting' => $setting->fresh(),
        ]);
    }
}
