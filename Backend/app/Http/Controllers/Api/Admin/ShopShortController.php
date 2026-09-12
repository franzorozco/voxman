<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop\ShopShort;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ShopShortController extends Controller
{
    /**
     * Display a listing of the shorts.
     */
    public function index(Request $request)
    {
        $shorts = ShopShort::with(['product:id,name', 'category:id,name'])
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($shorts);
    }

    /**
     * Store a newly created short in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'video' => 'nullable|file|mimes:mp4,mov,ogg,qt|max:50000', // max 50MB
            'video_link' => 'nullable|url',
            'title' => 'nullable|string|max:255',
            'product_id' => 'nullable|uuid|exists:products,id',
            'category_id' => 'nullable|uuid|exists:categories,id',
            'priority' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $videoUrl = null;
        if ($request->hasFile('video')) {
            $file = $request->file('video');
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $videoPath = $file->storeAs('system/shorts', $filename, 's3');
            $videoUrl = '/storage/' . $videoPath;
        } elseif ($request->video_link) {
            $videoUrl = $request->video_link;
        }

        if (!$videoUrl) {
            return response()->json(['error' => 'Video file or link is required.'], 400);
        }

        $short = ShopShort::create([
            'title' => $request->title,
            'video_url' => $videoUrl,
            'product_id' => $request->product_id,
            'category_id' => $request->category_id,
            'priority' => $request->priority ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        $short->load(['product:id,name', 'category:id,name']);

        return response()->json($short, 201);
    }

    /**
     * Display the specified short.
     */
    public function show($id)
    {
        $short = ShopShort::with(['product:id,name', 'category:id,name'])->findOrFail($id);
        return response()->json($short);
    }

    /**
     * Update the specified short in storage.
     */
    public function update(Request $request, $id)
    {
        $short = ShopShort::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'video' => 'nullable|file|mimes:mp4,mov,ogg,qt|max:50000',
            'video_link' => 'nullable|url',
            'title' => 'nullable|string|max:255',
            'product_id' => 'nullable|uuid|exists:products,id',
            'category_id' => 'nullable|uuid|exists:categories,id',
            'priority' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('video')) {
            // Delete old video if it's a local file
            if (str_starts_with($short->video_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $short->video_url);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $file = $request->file('video');
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $videoPath = $file->storeAs('system/shorts', $filename, 's3');
            $short->video_url = '/storage/' . $videoPath;
        } elseif ($request->video_link) {
             // Delete old video if it's a local file and we are replacing it with a link
             if (str_starts_with($short->video_url, '/storage/')) {
                 $oldPath = str_replace('/storage/', '', $short->video_url);
                 if (Storage::disk('public')->exists($oldPath)) {
                     Storage::disk('public')->delete($oldPath);
                 }
             }
             $short->video_url = $request->video_link;
        }

        if ($request->has('title')) {
            $short->title = $request->title;
        }
        if ($request->has('product_id')) {
            $short->product_id = $request->product_id;
        }
        if ($request->has('category_id')) {
            $short->category_id = $request->category_id;
        }
        if ($request->has('priority')) {
            $short->priority = $request->priority;
        }
        if ($request->has('is_active')) {
            $short->is_active = $request->boolean('is_active');
        }

        $short->save();
        $short->load(['product:id,name', 'category:id,name']);

        return response()->json($short);
    }

    /**
     * Remove the specified short from storage.
     */
    public function destroy($id)
    {
        $short = ShopShort::findOrFail($id);
        
        $oldPath = str_replace('/storage/', '', $short->video_url);
        if (Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $short->delete();

        return response()->json(['message' => 'Short deleted successfully']);
    }
}
