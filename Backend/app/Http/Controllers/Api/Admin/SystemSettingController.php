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
        $setting = SystemSetting::where('key', $key)->firstOrFail();
        
        if ($request->hasFile('value_file')) {
            $path = $request->file('value_file')->store('settings', 'public');
            $setting->update([
                'value' => '/storage/' . $path,
            ]);
        } else {
            $request->validate([
                'value' => 'nullable|string',
                'description' => 'nullable|string',
            ]);
            
            $setting->update([
                'value' => $request->value,
                'description' => $request->description ?? $setting->description,
            ]);
        }

        return response()->json([
            'message' => 'Configuración actualizada correctamente',
            'setting' => $setting
        ]);
    }
}
