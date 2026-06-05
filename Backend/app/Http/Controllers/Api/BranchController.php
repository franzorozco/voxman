<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Branch\Branch;
use App\Models\Branch\BranchImage;
use App\Models\Core\Address;
use App\Models\Actors\Employee;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $query = Branch::query()->with(['address', 'manager.user.profile', 'images']);

        if ($request->has('search') && $request->search != '') {
            $search = strtolower($request->search);
            $query->where(DB::raw('LOWER(name)'), 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
        }

        $branches = $query->orderBy('created_at', 'desc')->get();

        return response()->json($branches);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            $request->validate([
                'name' => 'required|string|max:150',
                'phone' => 'nullable|string|max:20',
                'is_active' => 'nullable|boolean',
            ]);

            // 1. Create Branch
            $branch = new Branch([
                'name' => $request->name,
                'phone' => $request->phone,
                'is_active' => $request->is_active ?? true,
            ]);
            $branch->id = Str::uuid()->toString();
            $branch->save();

            // 2. Create Address
            if ($request->has('address') && is_array($request->address)) {
                $addrData = $request->address;
                if (!empty($addrData['street']) || !empty($addrData['city']) || !empty($addrData['state'])) {
                    $address = new Address([
                        'branch_id' => $branch->id,
                        'address_type' => 'branch',
                        'country' => $addrData['country'] ?? 'Bolivia',
                        'state' => $addrData['state'] ?? null,
                        'city' => $addrData['city'] ?? null,
                        'zone' => $addrData['zone'] ?? null,
                        'street' => $addrData['street'] ?? null,
                        'reference' => $addrData['reference'] ?? null,
                    ]);
                    $address->id = Str::uuid()->toString();
                    $address->save();
                }
            }

            // 3. Assign Manager
            if ($request->has('manager_id') && $request->manager_id) {
                $employee = Employee::find($request->manager_id);
                if ($employee) {
                    $employee->branch_id = $branch->id;
                    $employee->role = 'manager';
                    $employee->save();
                }
            }

            // 4. Upload Images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $file) {
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('branches', $filename, 'public');

                    $isPrimary = false;
                    if ($request->has('primary_image_index') && $request->primary_image_index == $index) {
                        $isPrimary = true;
                    } elseif ($index === 0 && !$request->has('primary_image_index')) {
                        $isPrimary = true;
                    }

                    $image = new BranchImage([
                        'branch_id' => $branch->id,
                        'image_url' => '/storage/' . $filePath,
                        'is_primary' => $isPrimary,
                        'display_order' => $index,
                    ]);
                    $image->id = Str::uuid()->toString();
                    $image->save();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Sucursal creada exitosamente',
                'branch' => Branch::with(['address', 'manager.user.profile', 'images'])->find($branch->id)
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al crear la sucursal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $branch = Branch::with(['address', 'manager.user.profile', 'images'])->findOrFail($id);
        return response()->json($branch);
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $branch = Branch::findOrFail($id);

            $branch->update([
                'name' => $request->name ?? $branch->name,
                'phone' => $request->phone ?? $branch->phone,
                'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : $branch->is_active,
            ]);

            // Address
            if ($request->has('address') && is_array($request->address)) {
                $addrData = $request->address;
                $address = Address::where('branch_id', $branch->id)->where('address_type', 'branch')->first();
                
                if ($address) {
                    $address->update([
                        'country' => $addrData['country'] ?? $address->country,
                        'state' => $addrData['state'] ?? $address->state,
                        'city' => $addrData['city'] ?? $address->city,
                        'zone' => $addrData['zone'] ?? $address->zone,
                        'street' => $addrData['street'] ?? $address->street,
                        'reference' => $addrData['reference'] ?? $address->reference,
                    ]);
                } else if (!empty($addrData['street']) || !empty($addrData['city'])) {
                    $address = new Address([
                        'branch_id' => $branch->id,
                        'address_type' => 'branch',
                        'country' => $addrData['country'] ?? 'Bolivia',
                        'state' => $addrData['state'] ?? null,
                        'city' => $addrData['city'] ?? null,
                        'zone' => $addrData['zone'] ?? null,
                        'street' => $addrData['street'] ?? null,
                        'reference' => $addrData['reference'] ?? null,
                    ]);
                    $address->id = Str::uuid()->toString();
                    $address->save();
                }
            }

            // Manager
            if ($request->has('manager_id')) {
                // Remove old manager if exists
                $oldManager = Employee::where('branch_id', $branch->id)->where('role', 'manager')->first();
                if ($oldManager && $oldManager->id !== $request->manager_id) {
                    $oldManager->branch_id = null; // Or reassign
                    $oldManager->save();
                }

                if ($request->manager_id) {
                    $employee = Employee::find($request->manager_id);
                    if ($employee) {
                        $employee->branch_id = $branch->id;
                        $employee->role = 'manager';
                        $employee->save();
                    }
                }
            }

            // Images (Simplistic approach: delete missing, upload new)
            if ($request->has('retained_image_ids')) {
                $retainedIds = is_string($request->retained_image_ids) 
                    ? json_decode($request->retained_image_ids, true) 
                    : $request->retained_image_ids;
                
                BranchImage::where('branch_id', $branch->id)
                    ->whereNotIn('id', $retainedIds)
                    ->delete();
            } else if ($request->hasFile('images')) {
                 // If there are new images and no retained_image_ids passed, it means we replace all.
                 BranchImage::where('branch_id', $branch->id)->delete();
            }

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $file) {
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('branches', $filename, 'public');

                    $image = new BranchImage([
                        'branch_id' => $branch->id,
                        'image_url' => '/storage/' . $filePath,
                        'is_primary' => false,
                        'display_order' => $index,
                    ]);
                    $image->id = Str::uuid()->toString();
                    $image->save();
                }
            }

            // Set primary
            if ($request->has('primary_image_id')) {
                BranchImage::where('branch_id', $branch->id)->update(['is_primary' => false]);
                BranchImage::where('id', $request->primary_image_id)->update(['is_primary' => true]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Sucursal actualizada exitosamente',
                'branch' => Branch::with(['address', 'manager.user.profile', 'images'])->find($branch->id)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error($e);
            return response()->json([
                'message' => 'Error al actualizar la sucursal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $branch = Branch::findOrFail($id);
            $branch->delete(); // Soft delete
            return response()->json([
                'message' => 'Sucursal eliminada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la sucursal',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
