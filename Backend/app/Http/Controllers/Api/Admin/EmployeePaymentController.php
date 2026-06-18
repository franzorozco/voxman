<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Actors\EmployeePayment;
use App\Models\Actors\Employee;
use App\Models\Sales\Sale;
use Illuminate\Http\Request;
use Carbon\Carbon;

class EmployeePaymentController extends Controller
{
    public function history(Request $request)
    {
        $query = EmployeePayment::with('employee.user.profile')->orderBy('payment_date', 'desc');

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        return response()->json($query->get());
    }

    public function calculate(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000'
        ]);

        $employee = Employee::findOrFail($request->employee_id);
        
        $startOfMonth = Carbon::create($request->year, $request->month, 1)->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        $sales = Sale::where('employee_id', $employee->id)
            ->where('status', 'paid')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->get();

        $totalSales = $sales->sum('total');
        $commissionPercentage = $employee->commission_percentage ?? 0;
        $commissions = $totalSales * ($commissionPercentage / 100);

        // Check if already paid this month
        $existingPayment = EmployeePayment::where('employee_id', $employee->id)
            ->whereMonth('payment_date', $request->month)
            ->whereYear('payment_date', $request->year)
            ->first();

        return response()->json([
            'employee' => $employee->load('user.profile'),
            'base_salary' => $employee->base_salary ?? 0,
            'commissions' => $commissions,
            'total_sales' => $totalSales,
            'sales_count' => $sales->count(),
            'already_paid' => $existingPayment ? true : false,
            'existing_payment' => $existingPayment
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'base_salary' => 'required|numeric|min:0',
            'commissions' => 'required|numeric|min:0',
            'bonuses' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'payment_date' => 'required|date'
        ]);

        $totalPaid = $request->base_salary + $request->commissions + ($request->bonuses ?? 0) - ($request->deductions ?? 0);

        $payment = EmployeePayment::create([
            'employee_id' => $request->employee_id,
            'base_salary' => $request->base_salary,
            'commissions' => $request->commissions,
            'bonuses' => $request->bonuses ?? 0,
            'deductions' => $request->deductions ?? 0,
            'total_paid' => $totalPaid,
            'payment_date' => $request->payment_date,
        ]);

        return response()->json(['message' => 'Pago registrado exitosamente', 'payment' => $payment]);
    }
}
