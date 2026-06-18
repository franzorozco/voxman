<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Actors\Employee;
use App\Models\Core\User;
use App\Models\Core\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\Sales\Sale;
use Carbon\Carbon;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with(['user.profile']);
        $status = $request->query('status');
        
        if (empty($status)) {
            $status = 'active';
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function($q) use ($search) {
                $q->where('employee_code', 'ILIKE', "%{$search}%")
                  ->orWhereHas('user', function ($qUser) use ($search) {
                      $qUser->where('email', 'ILIKE', "%{$search}%")
                        ->orWhereHas('profile', function ($qProf) use ($search) {
                            $qProf->where('first_name', 'ILIKE', "%{$search}%")
                               ->orWhere('last_name_paternal', 'ILIKE', "%{$search}%")
                               ->orWhere('last_name_maternal', 'ILIKE', "%{$search}%")
                               ->orWhere('phone', 'ILIKE', "%{$search}%");
                        });
                  });
            });
        }
        
        $sortBy = $request->query('sortBy', 'created_at');
        $sortDir = strtolower($request->query('sortDir', 'desc')) === 'asc' ? 'asc' : 'desc';
        
        $allowedSorts = ['base_salary', 'hire_date', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return response()->json($query->get());
    }

    public function show($id)
    {
        $employee = Employee::with([
            'user.profile'
        ])->findOrFail($id);

        return response()->json($employee);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'role' => 'nullable|string|in:seller,delivery,admin,manager,cashier',
            'base_salary' => 'nullable|numeric|min:0',
            'commission_percentage' => 'nullable|numeric|min:0|max:100',
            'hire_date' => 'nullable|date',
            'contract_type' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean'
        ]);

        try {
            DB::beginTransaction();

            $isActive = $request->has('is_active') ? $request->boolean('is_active') : true;

            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password ?? Str::random(10)),
                'is_active' => $isActive
            ]);

            UserProfile::create([
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'last_name_paternal' => $request->last_name_paternal,
                'last_name_maternal' => $request->last_name_maternal,
                'phone' => $request->phone,
            ]);

            $employeeCode = 'EMP-' . strtoupper(Str::random(6));
            
            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => $employeeCode,
                'branch_id' => $request->branch_id,
                'role' => $request->role,
                'base_salary' => $request->base_salary ?? 0,
                'commission_percentage' => $request->commission_percentage ?? 0,
                'hire_date' => $request->hire_date,
                'contract_type' => $request->contract_type,
                'is_active' => $isActive,
                'status' => $isActive ? 'active' : 'inactive',
                'phone' => $request->phone
            ]);

            DB::commit();

            return response()->json(Employee::with('user.profile')->find($employee->id), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating employee', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        $user = $employee->user;
        $profile = $user->profile;

        $request->validate([
            'first_name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'role' => 'nullable|string|in:seller,delivery,admin,manager,cashier',
            'base_salary' => 'nullable|numeric|min:0',
            'commission_percentage' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'nullable|boolean'
        ]);

        try {
            DB::beginTransaction();

            $updateData = [
                'email' => $request->email,
            ];
            
            if ($request->has('is_active')) {
                $isActive = $request->boolean('is_active');
                $updateData['is_active'] = $isActive;
                $employee->update([
                    'is_active' => $isActive,
                    'status' => $isActive ? 'active' : 'inactive'
                ]);
            }

            $user->update($updateData);

            if ($request->has('password') && !empty($request->password)) {
                $user->update(['password' => Hash::make($request->password)]);
            }

            if ($profile) {
                $profile->update([
                    'first_name' => $request->first_name,
                    'last_name_paternal' => $request->last_name_paternal,
                    'last_name_maternal' => $request->last_name_maternal,
                    'phone' => $request->phone,
                ]);
            } else {
                UserProfile::create([
                    'user_id' => $user->id,
                    'first_name' => $request->first_name,
                    'last_name_paternal' => $request->last_name_paternal,
                    'last_name_maternal' => $request->last_name_maternal,
                    'phone' => $request->phone,
                ]);
            }

            $employee->update([
                'branch_id' => $request->branch_id,
                'role' => $request->role,
                'base_salary' => $request->base_salary ?? 0,
                'commission_percentage' => $request->commission_percentage ?? 0,
                'hire_date' => $request->hire_date,
                'contract_type' => $request->contract_type,
                'phone' => $request->phone,
                'emergency_contact' => $request->emergency_contact,
                'notes' => $request->notes
            ]);

            DB::commit();

            return response()->json(Employee::with('user.profile')->find($employee->id));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating employee', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $employee->update([
            'is_active' => false,
            'status' => 'inactive'
        ]);
        
        if ($employee->user) {
            $employee->user->update(['is_active' => false]);
            $employee->user->delete();
        }
        
        $employee->delete();

        return response()->json(['message' => 'Employee deactivated successfully']);
    }

    public function forceDestroy($id)
    {
        $employee = Employee::withTrashed()->findOrFail($id);
        
        if ($employee->user) {
            $employee->user->forceDelete();
        }
        
        $employee->forceDelete();

        return response()->json(['message' => 'Employee permanently deleted']);
    }

    public function getDeleted(Request $request)
    {
        $query = Employee::onlyTrashed()->with(['user' => function($q) {
            $q->withTrashed()->with('profile');
        }]);

        if ($request->has('search') && !empty($request->query('search'))) {
            $search = $request->query('search');
            $query->where(function($q) use ($search) {
                $q->where('employee_code', 'ILIKE', "%{$search}%")
                  ->orWhereHas('user', function ($qUser) use ($search) {
                      $qUser->withTrashed()
                            ->where('email', 'ILIKE', "%{$search}%")
                            ->orWhereHas('profile', function ($qProf) use ($search) {
                                $qProf->where('first_name', 'ILIKE', "%{$search}%")
                                      ->orWhere('last_name_paternal', 'ILIKE', "%{$search}%")
                                      ->orWhere('phone', 'ILIKE', "%{$search}%");
                            });
                  });
            });
        }

        return response()->json($query->orderBy('deleted_at', 'desc')->get());
    }

    public function restore($id)
    {
        $employee = Employee::onlyTrashed()->findOrFail($id);
        $employee->restore();
        $employee->update([
            'is_active' => true,
            'status' => 'active'
        ]);

        if ($employee->user()->withTrashed()->first()) {
            $user = $employee->user()->withTrashed()->first();
            $user->restore();
            $user->update(['is_active' => true]);
        }

        return response()->json(['message' => 'Employee restored successfully']);
    }
    public function stats($id)
    {
        $employee = Employee::findOrFail($id);
        
        $currentMonth = Carbon::now()->startOfMonth();
        $endMonth = Carbon::now()->endOfMonth();

        // 1. Current Month Sales (Status = 'paid', using SoftDeletes)
        $currentMonthSales = Sale::where('employee_id', $employee->id)
            ->where('status', 'paid')
            ->whereBetween('created_at', [$currentMonth, $endMonth])
            ->get();

        $totalSalesMonth = $currentMonthSales->sum('total');
        $salesCountMonth = $currentMonthSales->count();
        
        // Average ticket
        $averageTicketMonth = $salesCountMonth > 0 ? $totalSalesMonth / $salesCountMonth : 0;

        // Estimated Commissions for current month
        $commissionPercentage = $employee->commission_percentage ?? 0;
        $estimatedCommissionsMonth = $totalSalesMonth * ($commissionPercentage / 100);

        // 2. Last 6 Months Sales Chart Data
        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
        $historySales = Sale::where('employee_id', $employee->id)
            ->where('status', 'paid')
            ->where('created_at', '>=', $sixMonthsAgo)
            ->select(DB::raw('SUM(total) as total_sales, COUNT(id) as total_count, EXTRACT(MONTH FROM created_at) as month, EXTRACT(YEAR FROM created_at) as year'))
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        // Format chart data filling empty months
        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $year = $date->year;
            $month = $date->month;
            
            $monthData = $historySales->first(function($item) use ($year, $month) {
                return $item->year == $year && $item->month == $month;
            });

            $chartData[] = [
                'label' => $date->translatedFormat('M Y'),
                'total_sales' => $monthData ? (float) $monthData->total_sales : 0,
                'sales_count' => $monthData ? (int) $monthData->total_count : 0
            ];
        }

        // 3. Last 5 Recent Sales
        $recentSales = Sale::where('employee_id', $employee->id)
            ->where('status', 'paid')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'current_month' => [
                'total_sales' => $totalSalesMonth,
                'sales_count' => $salesCountMonth,
                'average_ticket' => $averageTicketMonth,
                'estimated_commissions' => $estimatedCommissionsMonth,
                'commission_percentage' => $commissionPercentage
            ],
            'chart_data' => $chartData,
            'recent_sales' => $recentSales
        ]);
    }
}
