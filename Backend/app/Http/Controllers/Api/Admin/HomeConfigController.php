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
}