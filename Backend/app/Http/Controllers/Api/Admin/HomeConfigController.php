<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HomeConfigController extends Controller
{
    public function variantImages(Request $request)
    {
        // 1. En Postgres, obtenemos la primera url por cada variant_id usando DISTINCT ON
        $query1 = DB::table('variant_images')
            ->selectRaw('DISTINCT ON (variant_id) url')
            ->whereNotNull('url')
            ->where('url', '!=', '');

        // 2. Imagenes de attribute_value_images con is_main = true
        $query2 = DB::table('attribute_value_images')
            ->select('url')
            ->where('is_main', true)
            ->whereNotNull('url')
            ->where('url', '!=', '');

        $combinedQuery = $query1->union($query2);

        $finalQuery = DB::table(DB::raw("({$combinedQuery->toSql()}) as combined_urls"))
            ->mergeBindings($combinedQuery)
            ->select('url')
            ->distinct();

        $paginated = $finalQuery->paginate(15);
        
        $urls = collect($paginated->items())->pluck('url')->toArray();
        
        return response()->json([
            'data' => $urls,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function categories()
    {
        $categories = \App\Models\Catalog\Category::select('id', 'name')->orderBy('name')->get();
        return response()->json($categories);
    }

    public function uploadCategoryImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:5120'
        ]);

        $file = $request->file('image');
        $fullPath = 'catalog/categories/' . \Illuminate\Support\Str::uuid() . '.' . \App\Support\SecureUpload::validate($file, 'image', 'image');

        try {
            $contents = file_get_contents($file->getRealPath());
            $result = \Illuminate\Support\Facades\Storage::disk('s3')->put($fullPath, $contents);

            if (!$result) {
                return response()->json(['message' => 'Error al subir imagen'], 500);
            }

            return response()->json(['url' => $fullPath]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al acceder al almacenamiento'], 500);
        }
    }

    public function uploadBackgroundImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:10240'
        ]);

        $file = $request->file('image');
        $fullPath = 'system/funds/' . \Illuminate\Support\Str::uuid() . '.' . \App\Support\SecureUpload::validate($file, 'image', 'image');

        try {
            $contents = file_get_contents($file->getRealPath());
            $result = \Illuminate\Support\Facades\Storage::disk('s3')->put($fullPath, $contents);

            if (!$result) {
                return response()->json(['message' => 'Error al subir fondo'], 500);
            }

            return response()->json(['url' => $fullPath]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al acceder al almacenamiento'], 500);
        }
    }

    public function backgroundImages()
    {
        try {
            $files = \Illuminate\Support\Facades\Storage::disk('s3')->files('system/funds');
            // Filter to only image extensions
            $images = array_values(array_filter($files, function($file) {
                return preg_match('/\.(jpg|jpeg|png|webp|jfif|gif)$/i', $file);
            }));
            
            return response()->json(['data' => $images]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al acceder al almacenamiento'], 500);
        }
    }

    public function uploadVideoPage(Request $request)
    {
        $request->validate([
            'video' => 'required|mimetypes:video/mp4,video/quicktime,video/webm|max:51200' // 50MB max
        ]);

        $file = $request->file('video');
        $fullPath = 'system/video_pages/' . \Illuminate\Support\Str::uuid() . '.' . \App\Support\SecureUpload::validate($file, 'video', 'video');

        try {
            $contents = file_get_contents($file->getRealPath());
            $result = \Illuminate\Support\Facades\Storage::disk('s3')->put($fullPath, $contents);

            if (!$result) {
                return response()->json(['message' => 'Error al subir el video'], 500);
            }

            return response()->json(['url' => $fullPath]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al acceder al almacenamiento'], 500);
        }
    }

    public function videoPages()
    {
        try {
            $files = \Illuminate\Support\Facades\Storage::disk('s3')->files('system/video_pages');
            if (!is_array($files)) {
                $files = [];
            }
            
            // Filter to only video extensions
            $videos = array_values(array_filter($files, function($file) {
                return preg_match('/\.(mp4|webm|mov|avi)$/i', $file);
            }));
            
            return response()->json(['data' => $videos]);
        } catch (\Exception $e) {
            // Si la carpeta no existe o hay error de S3, devolvemos array vacío
            return response()->json(['data' => []]);
        }
    }
    public function uploadActorImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:10240'
        ]);

        $file = $request->file('image');
        $fullPath = 'system/actors/' . \Illuminate\Support\Str::uuid() . '.' . \App\Support\SecureUpload::validate($file, 'image', 'image');

        try {
            $contents = file_get_contents($file->getRealPath());
            $result = \Illuminate\Support\Facades\Storage::disk('s3')->put($fullPath, $contents);

            if (!$result) {
                return response()->json(['message' => 'Error al subir imagen de actor'], 500);
            }

            return response()->json(['url' => $fullPath]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al acceder al almacenamiento'], 500);
        }
    }

    public function actorImages()
    {
        try {
            $files = \Illuminate\Support\Facades\Storage::disk('s3')->files('system/actors');
            if (!is_array($files)) {
                $files = [];
            }
            
            return response()->json(['data' => $files]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al acceder al almacenamiento'], 500);
        }
    }
}
