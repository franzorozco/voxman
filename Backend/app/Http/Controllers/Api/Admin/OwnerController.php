<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Actors\Owner;

class OwnerController extends Controller
{
    public function index()
    {
        $owners = Owner::with(['user.profile', 'user.roles', 'owner_payments' => function($q) {
            $q->whereIn('status', ['paid', 'archived']);
        }])
            ->withCount(['products'])
            ->where('is_active', true)
            ->whereHas('user', function ($q) {
                $q->where('is_active', true);
            })
            ->get();

        $owners->each(function($owner) {
            $deposits = $owner->owner_payments->where('type', 'deposit')->sum('total_amount');
            $withdrawals = $owner->owner_payments->where('type', 'withdrawal')->sum('total_amount');
            
            // Calculate inventory value
            $inventoryValue = \App\Models\Inventory\Inventory::whereHas('variant.product', function($q) use ($owner) {
                $q->where('owner_id', $owner->id);
            })->get()->sum(function($inv) {
                return $inv->stock * ($inv->variant->cost ?? 0);
            });

            $reservedInventoryValue = \App\Models\Inventory\StockReservation::whereHas('variant.product', function($q) use ($owner) {
                $q->where('owner_id', $owner->id);
            })->get()->sum(function($res) {
                return $res->quantity * ($res->variant->cost ?? 0);
            });
            $inventoryValue += $reservedInventoryValue;

            // Calculate Net Profit
            $totalSales = \App\Models\Sales\SaleDetail::where('owner_id', $owner->id)
                ->whereHas('sale', function($q) {
                    $q->where('status', 'paid');
                })->sum('subtotal');

            $totalExpenses = \App\Models\Finance\ExpenseSplit::where('owner_id', $owner->id)
                ->whereIn('status', ['paid', 'archived'])
                ->sum('amount');
            
            $netProfit = $totalSales - $totalExpenses;

            // Total Capital = Deposits + Inventory Value (What the owner invested into the business)
            $owner->total_capital = $deposits + $inventoryValue;
            unset($owner->owner_payments); // Don't send all payments in index
        });

        return $owners;
    }

    public function show($id)
    {
        $owner = Owner::with('user')->findOrFail($id);
        return response()->json($owner);
    }

    public function profile($id)
    {
        $owner = Owner::with(['user.profile', 'user.roles', 'owner_payments' => function($q) {
            $q->orderBy('payment_date', 'DESC');
        }])->findOrFail($id);

        $deposits = $owner->owner_payments->where('type', 'deposit')->whereIn('status', ['paid', 'archived'])->sum('total_amount');
        $withdrawals = $owner->owner_payments->where('type', 'withdrawal')->whereIn('status', ['paid', 'archived'])->sum('total_amount');

        $inventoryItems = \App\Models\Inventory\Inventory::with(['variant.product'])
            ->whereHas('variant.product', function($q) use ($id) {
                $q->where('owner_id', $id);
            })->get();

        $totalInventoryValue = 0;
        $totalStock = 0;
        foreach($inventoryItems as $inv) {
            $stock = (int)$inv->stock;
            $totalStock += $stock;
            if ($inv->variant) {
                $totalInventoryValue += (float)$inv->variant->cost * $stock;
            }
        }

        $reservedItems = \App\Models\Inventory\StockReservation::with(['variant.product'])
            ->whereHas('variant.product', function($q) use ($id) {
                $q->where('owner_id', $id);
            })->get();

        foreach($reservedItems as $res) {
            $qty = (int)$res->quantity;
            $totalStock += $qty;
            if ($res->variant) {
                $totalInventoryValue += (float)$res->variant->cost * $qty;
            }
        }
        $totalCapital = $deposits + $totalInventoryValue; // Update total capital after reserved inventory is calculated

        $totalSales = \App\Models\Sales\SaleDetail::where('owner_id', $id)
            ->whereHas('sale', function($q) {
                $q->where('status', 'paid');
            })->sum('subtotal');

        $itemsSold = \App\Models\Sales\SaleDetail::where('owner_id', $id)
            ->whereHas('sale', function($q) {
                $q->where('status', 'paid');
            })->sum('quantity');

        $totalExpenses = \App\Models\Finance\ExpenseSplit::where('owner_id', $id)
            ->whereIn('status', ['paid', 'archived'])
            ->sum('amount');

        $products = \App\Models\Catalog\Product::with(['product_variants.size', 'product_variants.fit'])
            ->where('owner_id', $id)
            ->get();

        // --- FUND BREAKDOWN LOGIC ---
        $branches = \App\Models\Branch\Branch::all();
        $fund_breakdown = [];

        foreach ($branches as $branch) {
            // Capital (OwnerPayments)
            $branchPayments = $owner->owner_payments->where('branch_id', $branch->id)->whereIn('status', ['paid', 'archived']);
            $cashDeposits = $branchPayments->where('type', 'deposit')->where('fund_source', 'cash')->sum('total_amount');
            $cashWithdrawals = $branchPayments->where('type', 'withdrawal')->where('fund_source', 'cash')->sum('total_amount');
            $bankDeposits = $branchPayments->where('type', 'deposit')->where('fund_source', 'bank')->sum('total_amount');
            $bankWithdrawals = $branchPayments->where('type', 'withdrawal')->where('fund_source', 'bank')->sum('total_amount');

            $capitalCash = $cashDeposits - $cashWithdrawals;
            $capitalBank = $bankDeposits - $bankWithdrawals;

            // Sales (Ventas netas del socio)
            $salesCash = \App\Models\Sales\SaleDetail::join('sales', 'sale_details.sale_id', '=', 'sales.id')
                ->join('payments', 'payments.sale_id', '=', 'sales.id')
                ->join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
                ->where('sale_details.owner_id', $id)
                ->where('sales.branch_id', $branch->id)
                ->where('sales.status', 'paid')
                ->where('payment_methods.name', 'Efectivo')
                ->sum('sale_details.subtotal');

            $salesBank = \App\Models\Sales\SaleDetail::join('sales', 'sale_details.sale_id', '=', 'sales.id')
                ->join('payments', 'payments.sale_id', '=', 'sales.id')
                ->join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
                ->where('sale_details.owner_id', $id)
                ->where('sales.branch_id', $branch->id)
                ->where('sales.status', 'paid')
                ->where('payment_methods.name', '!=', 'Efectivo')
                ->sum('sale_details.subtotal');

            // Expenses (Gastos asignados al socio)
            $expensesCash = \App\Models\Finance\ExpenseSplit::join('expenses', 'expense_splits.expense_id', '=', 'expenses.id')
                ->where('expense_splits.owner_id', $id)
                ->where('expenses.branch_id', $branch->id)
                ->whereIn('expense_splits.status', ['paid', 'archived'])
                ->where('expenses.fund_source', 'cash')
                ->sum('expense_splits.amount');

            $expensesBank = \App\Models\Finance\ExpenseSplit::join('expenses', 'expense_splits.expense_id', '=', 'expenses.id')
                ->where('expense_splits.owner_id', $id)
                ->where('expenses.branch_id', $branch->id)
                ->whereIn('expense_splits.status', ['paid', 'archived'])
                ->where('expenses.fund_source', 'bank')
                ->sum('expense_splits.amount');

            $netCash = $capitalCash + $salesCash - $expensesCash;
            $netBank = $capitalBank + $salesBank - $expensesBank;

            // Solo agregamos sucursales donde el socio tenga algún tipo de liquidez o movimiento
            if ($netCash != 0 || $netBank != 0 || $capitalCash != 0 || $capitalBank != 0 || $salesCash != 0 || $salesBank != 0 || $expensesCash != 0 || $expensesBank != 0) {
                $fund_breakdown[] = [
                    'branch_name' => $branch->name,
                    'branch_id' => $branch->id,
                    'cash' => [
                        'capital' => (float)$capitalCash,
                        'sales' => (float)$salesCash,
                        'expenses' => (float)$expensesCash,
                        'net_liquidity' => (float)$netCash
                    ],
                    'bank' => [
                        'capital' => (float)$capitalBank,
                        'sales' => (float)$salesBank,
                        'expenses' => (float)$expensesBank,
                        'net_liquidity' => (float)$netBank
                    ]
                ];
            }
        }

        return response()->json([
            'owner' => $owner,
            'kpis' => [
                'total_capital' => $totalCapital,
                'inventory_value' => $totalInventoryValue,
                'total_stock' => $totalStock,
                'items_sold' => (int)$itemsSold,
                'gross_sales' => (float)$totalSales,
                'assigned_expenses' => (float)$totalExpenses,
                'net_profit' => (float)$totalSales - (float)$totalExpenses,
                'available_liquidity' => (float)$deposits - (float)$withdrawals + ((float)$totalSales - (float)$totalExpenses)
            ],
            'products' => $products,
            'fund_breakdown' => $fund_breakdown
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean'
        ]);

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            $isActive = $request->has('is_active') ? $request->boolean('is_active') : true;

            $user = \App\Models\Core\User::create([
                'email' => $request->email,
                'password' => \Illuminate\Support\Facades\Hash::make($request->password),
                'is_active' => $isActive
            ]);

            \App\Models\Core\UserProfile::create([
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'last_name_paternal' => $request->last_name_paternal,
                'last_name_maternal' => $request->last_name_maternal,
                'phone' => $request->phone,
            ]);
            
            $owner = Owner::create([
                'user_id' => $user->id,
                'is_active' => $isActive
            ]);

            $user->assignRole('Owner');

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Owner creado correctamente',
                'data' => Owner::with('user.profile')->find($owner->id)
            ], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Error creando owner', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $owner = Owner::findOrFail($id);
        $user = $owner->user;
        $profile = $user->profile;

        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean'
        ]);

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            $updateData = [];
            
            // Verificamos si el usuario actual tiene permisos para modificar credenciales
            $canManageCredentials = $request->user() && $request->user()->can('manage_owners_credentials');

            if ($request->has('email') && !empty($request->email)) {
                if ($canManageCredentials) {
                    $updateData['email'] = $request->email;
                } else if ($request->email !== $user->email) {
                    throw new \Exception("No tienes permiso para modificar el correo electrónico.");
                }
            }
            
            if ($request->has('is_active')) {
                $isActive = $request->boolean('is_active');
                $updateData['is_active'] = $isActive;
                $owner->update([
                    'is_active' => $isActive
                ]);
            }

            if (!empty($updateData)) {
                $user->update($updateData);
            }

            if ($request->has('password') && !empty($request->password)) {
                if ($canManageCredentials) {
                    $user->update(['password' => \Illuminate\Support\Facades\Hash::make($request->password)]);
                } else {
                    throw new \Exception("No tienes permiso para modificar la contraseña.");
                }
            }

            if ($profile) {
                $profile->update([
                    'first_name' => $request->first_name,
                    'last_name_paternal' => $request->last_name_paternal,
                    'last_name_maternal' => $request->last_name_maternal,
                    'phone' => $request->phone
                ]);
            } else {
                \App\Models\Core\UserProfile::create([
                    'user_id' => $user->id,
                    'first_name' => $request->first_name,
                    'last_name_paternal' => $request->last_name_paternal,
                    'last_name_maternal' => $request->last_name_maternal,
                    'phone' => $request->phone,
                ]);
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Owner actualizado correctamente',
                'data' => Owner::with('user.profile')->find($owner->id)
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Error actualizando owner', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $owner = Owner::findOrFail($id);

        $owner->delete();

        return response()->json([
            'message' => 'Owner eliminado correctamente'
        ]);
    }
}