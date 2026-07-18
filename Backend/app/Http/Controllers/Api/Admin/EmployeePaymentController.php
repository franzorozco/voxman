<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Actors\EmployeePayment;
use App\Models\Actors\Employee;
use App\Models\Actors\EmployeeAttendance;
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
        
        if ($request->has('month') && $request->has('year')) {
            $query->whereMonth('payment_date', $request->month)
                  ->whereYear('payment_date', $request->year);
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
        
        // Define cycle bounds based on hire_date
        $hireDate = $employee->hire_date ? Carbon::parse($employee->hire_date) : null;
        $hireDay = $hireDate ? clone $hireDate->day : 1;
        
        // If hire_day is e.g. 3, cycle for July (month 7) goes from June 3 to July 2.
        // If hire_day is > 28, handle edge cases.
        $cycleEnd = Carbon::createFromDate($request->year, $request->month, 1)->endOfMonth();
        $targetDay = min($hireDay, $cycleEnd->day);
        
        $endOfCycle = Carbon::createFromDate($request->year, $request->month, $targetDay)->endOfDay();
        $startOfCycle = clone $endOfCycle;
        $startOfCycle->subMonth()->addDay()->startOfDay();

        $sales = Sale::where('employee_id', $employee->id)
            ->where('status', 'paid')
            ->whereBetween('created_at', [$startOfCycle, $endOfCycle])
            ->get();

        $totalSales = $sales->sum('total');
        $commissionPercentage = $employee->commission_percentage ?? 0;
        $commissions = $totalSales * ($commissionPercentage / 100);
        
        // Calculate absences and lates in this cycle
        $attendances = EmployeeAttendance::where('employee_id', $employee->id)
            ->whereBetween('date', [$startOfCycle->toDateString(), $endOfCycle->toDateString()])
            ->get();
            
        $absencesCount = $attendances->where('status', 'absent')->count();
        $latesCount = $attendances->where('status', 'late')->count();

        // Check if already paid this cycle (using payment_date to represent the month it pays for)
        $existingPayment = EmployeePayment::where('employee_id', $employee->id)
            ->whereMonth('payment_date', $request->month)
            ->whereYear('payment_date', $request->year)
            ->first();
            
        $baseSalary = $employee->base_salary ?? 0;
        $salaryPerDay = $baseSalary / 30;

        return response()->json([
            'employee' => $employee->load('user.profile'),
            'base_salary' => $baseSalary,
            'salary_per_day' => $salaryPerDay,
            'commissions' => $commissions,
            'total_sales' => $totalSales,
            'sales_count' => $sales->count(),
            'absences_count' => $absencesCount,
            'lates_count' => $latesCount,
            'start_cycle' => $startOfCycle->toDateString(),
            'end_cycle' => $endOfCycle->toDateString(),
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

    public function destroy($id)
    {
        $payment = EmployeePayment::findOrFail($id);
        $payment->delete();

        return response()->json(['message' => 'Pago anulado exitosamente']);
    }
}
