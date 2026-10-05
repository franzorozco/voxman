<?php

namespace App\Http\Controllers\Api\shop;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Category;
use App\Models\System\SystemSetting;

class ShopCategoryController extends Controller
{
    public function index()
    {
        // Traer todas las categorias (sin soft deleted)
        // OPTIMIZATION: Cache the full category tree since it rarely changes
        $result = \Illuminate\Support\Facades\Cache::remember('shop_all_categories', 600, function () {
            $all = Category::select('id', 'name', 'parent_id')->get()->keyBy('id');

            // Leer config de home: categorias seleccionadas + metadatos (imagen, orden)
            $settingRow = SystemSetting::where('key', 'home_featured_categories')->first();
            $config     = $settingRow ? json_decode($settingRow->value, true) : [];

            // Adjuntar imagen y orden desde config
            return $all->map(function ($cat) use ($config) {
                $meta = collect($config)->firstWhere('id', $cat->id);
                return [
                    'id'       => $cat->id,
                    'name'     => $cat->name,
                    'parent_id'=> $cat->parent_id,
                    'image'    => $meta['image']    ?? null,
                    'order'    => $meta['order']    ?? 999,
                    'featured' => $meta !== null,
                ];
            })->values()->all();
        });

        return response()->json($result);
    }

    /**
     * Endpoint publico: solo devuelve las categorias marcadas como destacadas
     * ordenadas por su campo 'order', con imagen.
     */
    public function featured()
    {
        // OPTIMIZATION: Cache featured categories for 10 minutes to avoid DB queries
        $result = \Illuminate\Support\Facades\Cache::remember('shop_featured_categories', 600, function () {
            $settingRow = SystemSetting::where('key', 'home_featured_categories')->first();
            $config     = $settingRow ? json_decode($settingRow->value, true) : [];

            if (empty($config)) {
                return [];
            }

            // Obtener solo las categorias que estan en la config
            $ids  = array_column($config, 'id');
            $cats = Category::select('id', 'name')->whereIn('id', $ids)->get()->keyBy('id');

            // Construir respuesta ordenada
            return collect($config)
                ->filter(fn($m) => $cats->has($m['id']))
                ->sortBy('order')
                ->map(fn($m) => [
                    'id'    => $m['id'],
                    'name'  => $cats[$m['id']]->name,
                    'image' => $m['image'] ?? null,
                    'order' => $m['order'],
                ])
                ->values()
                ->all();
        });

        return response()->json($result);
    }
}
