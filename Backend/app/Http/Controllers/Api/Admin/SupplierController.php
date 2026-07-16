<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Purchase\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query();

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('company_name', 'LIKE', "%{$search}%")
                  ->orWhere('contact_name', 'LIKE', "%{$search}%")
                  ->orWhere('tax_id', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:150',
            'contact_name' => 'nullable|string|max:150',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'company_name' => 'nullable|string|max:150',
            'tax_id' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
        ]);

        $supplier = Supplier::create([
            'id' => Str::uuid(),
            'name' => $request->name,
            'contact_name' => $request->contact_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'company_name' => $request->company_name,
            'tax_id' => $request->tax_id,
            'status' => $request->status ?? 'active',
        ]);

        return response()->json([
            'message' => 'Proveedor creado exitosamente',
            'supplier' => $supplier
        ], 201);
    }

    public function show($id)
    {
        $supplier = Supplier::findOrFail($id);
        return response()->json($supplier);
    }

    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:150',
            'contact_name' => 'nullable|string|max:150',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'company_name' => 'nullable|string|max:150',
            'tax_id' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
        ]);

        $supplier->update($request->only([
            'name', 'contact_name', 'phone', 'email', 'company_name', 'tax_id', 'status'
        ]));

        return response()->json([
            'message' => 'Proveedor actualizado exitosamente',
            'supplier' => $supplier
        ]);
    }

    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->status = 'inactive';
        $supplier->save();
        $supplier->delete();

        return response()->json(['message' => 'Proveedor desactivado y eliminado logicamente']);
    }

    public function deleted()
    {
        $suppliers = Supplier::onlyTrashed()->orderBy('deleted_at', 'desc')->get();
        return response()->json($suppliers);
    }

    public function restore($id)
    {
        $supplier = Supplier::onlyTrashed()->findOrFail($id);
        $supplier->restore();
        $supplier->status = 'active';
        $supplier->save();

        return response()->json(['message' => 'Proveedor restaurado exitosamente']);
    }

    public function forceDestroy($id)
    {
        $supplier = Supplier::onlyTrashed()->findOrFail($id);
        $supplier->forceDelete();

        return response()->json(['message' => 'Proveedor eliminado de forma permanente']);
    }

    public function stats()
    {
        $totalSuppliers = Supplier::count();
        $activeSuppliers = Supplier::where('status', 'active')->count();
        
        // Cargar modelo Purchase de base de datos
        $purchasesThisMonth = \App\Models\Purchase\Purchase::whereMonth('created_at', now()->month)
                                  ->whereYear('created_at', now()->year)
                                  ->sum('total');

        return response()->json([
            'total_suppliers' => $totalSuppliers,
            'active_suppliers' => $activeSuppliers,
            'purchases_this_month' => $purchasesThisMonth
        ]);
    }

    public function profile($id)
    {
        $supplier = Supplier::with(['purchases' => function($q) {
            $q->orderBy('created_at', 'desc')->take(20);
        }])->findOrFail($id);
        
        $totalSpent = \App\Models\Purchase\Purchase::where('supplier_id', $id)->sum('total');

        return response()->json([
            'supplier' => $supplier,
            'stats' => [
                'total_spent' => $totalSpent,
                'total_purchases' => $supplier->purchases->count()
            ]
        ]);
    }
}
