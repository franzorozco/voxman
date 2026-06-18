<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Actors\EmployeeAttendance;
use App\Models\Actors\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;

class EmployeeAttendanceController extends Controller
{
    public function index(Request $request)
    {
        // Admin report of attendances
        $query = EmployeeAttendance::with('employee.user.profile')->orderBy('date', 'desc');

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        return response()->json($query->get());
    }

    public function checkIn(Request $request)
    {
        $request->validate([
            'employee_id' => 'required'
        ]);

        $employee = Employee::where('user_id', $request->employee_id)
            ->orWhere('id', $request->employee_id)
            ->first();

        if (!$employee) {
            return response()->json(['message' => 'Empleado no encontrado asociado a este usuario'], 404);
        }

        $today = Carbon::today()->toDateString();
        $employeeId = $employee->id;

        // Check if already checked in today
        $attendance = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('date', $today)
            ->first();

        if ($attendance) {
            return response()->json(['message' => 'Ya has registrado tu entrada hoy', 'attendance' => $attendance], 400);
        }

        $now = Carbon::now();
        // Assume check-in after 9:15 AM is late (configurable later)
        $status = $now->format('H:i') > '09:15' ? 'late' : 'present';

        $attendance = EmployeeAttendance::create([
            'employee_id' => $employeeId,
            'date' => $today,
            'check_in' => $now,
            'status' => $status
        ]);

        return response()->json(['message' => 'Entrada registrada exitosamente', 'attendance' => $attendance]);
    }

    public function checkOut(Request $request)
    {
        $request->validate([
            'employee_id' => 'required'
        ]);

        $employee = Employee::where('user_id', $request->employee_id)
            ->orWhere('id', $request->employee_id)
            ->first();

        if (!$employee) {
            return response()->json(['message' => 'Empleado no encontrado asociado a este usuario'], 404);
        }

        $today = Carbon::today()->toDateString();
        $employeeId = $employee->id;

        $attendance = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('date', $today)
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'No has registrado entrada hoy'], 400);
        }

        if ($attendance->check_out) {
            return response()->json(['message' => 'Ya has registrado tu salida hoy', 'attendance' => $attendance], 400);
        }

        $attendance->update([
            'check_out' => Carbon::now()
        ]);

        return response()->json(['message' => 'Salida registrada exitosamente', 'attendance' => $attendance]);
    }

    public function status($employeeId)
    {
        $employee = Employee::where('user_id', $employeeId)
            ->orWhere('id', $employeeId)
            ->first();

        if (!$employee) {
            return response()->json(['attendance' => null]);
        }

        $today = Carbon::today()->toDateString();
        $attendance = EmployeeAttendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        return response()->json(['attendance' => $attendance]);
    }
}
