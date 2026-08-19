<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\System\SystemSetting;

class SystemSettingController extends Controller
{
    public function index()
    {
        $settings = SystemSetting::all();
        return response()->json($settings);
    }

    public function update(Request $request, $key)
    {
        $request->validate([
            'value' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $setting = SystemSetting::where('key', $key)->firstOrFail();
        
        $setting->update([
            'value' => $request->value,
            'description' => $request->description ?? $setting->description,
        ]);

        return response()->json([
            'message' => 'Configuración actualizada correctamente',
            'setting' => $setting
        ]);
    }
}
