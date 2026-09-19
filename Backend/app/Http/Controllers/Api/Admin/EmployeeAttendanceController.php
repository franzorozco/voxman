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
        // Shift start time logic, add 15 minutes grace period
        $shiftStart = $employee->shift_start_time ? Carbon::parse($employee->shift_start_time) : Carbon::parse('09:00:00');
        $graceTime = $shiftStart->copy()->addMinutes(15);
        $status = $now->format('H:i') > $graceTime->format('H:i') ? 'late' : 'present';

        $attendance = EmployeeAttendance::create([
            'employee_id' => $employeeId,
            'date' => $today,
            'check_in' => $now,
            'status' => $status
        ]);

        return response()->json(['message' => 'Entrada registrada exitosamente', 'attendance' => $attendance]);
    }

    // Admin Methods
    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|string',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string'
        ]);

        $attendance = EmployeeAttendance::updateOrCreate(
            ['employee_id' => $request->employee_id, 'date' => $request->date],
            [
                'check_in' => $request->check_in ? $request->date . ' ' . $request->check_in . ':00' : null,
                'check_out' => $request->check_out ? $request->date . ' ' . $request->check_out . ':00' : null,
                'status' => $request->status,
                'notes' => $request->notes
            ]
        );

        return response()->json(['message' => 'Asistencia registrada', 'attendance' => $attendance]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string'
        ]);

        $attendance = EmployeeAttendance::findOrFail($id);

        $date = $attendance->date;

        $attendance->update([
            'check_in' => $request->check_in ? $date . ' ' . $request->check_in . ':00' : null,
            'check_out' => $request->check_out ? $date . ' ' . $request->check_out . ':00' : null,
            'status' => $request->status,
            'notes' => $request->notes
        ]);

        return response()->json(['message' => 'Asistencia actualizada', 'attendance' => $attendance]);
    }

    public function destroy($id)
    {
        $attendance = EmployeeAttendance::findOrFail($id);
        $attendance->delete();

        return response()->json(['message' => 'Asistencia eliminada']);
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
