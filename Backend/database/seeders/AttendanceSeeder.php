<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Actors\Employee;
use App\Models\Actors\EmployeeAttendance;
use Carbon\Carbon;
use Illuminate\Support\Str;

class AttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employees = Employee::where('is_active', true)->get();

        if ($employees->isEmpty()) {
            $this->command->info('No active employees found to seed attendances.');
            return;
        }

        $startDate = Carbon::today()->subDays(30);
        $endDate = Carbon::today();

        foreach ($employees as $employee) {
            $currentDate = $startDate->copy();
            
            // Get employee shift start time or default to 09:00:00
            $shiftStartStr = $employee->shift_start_time ?: '09:00:00';
            $shiftEndStr = $employee->shift_end_time ?: '18:00:00';

            while ($currentDate->lte($endDate)) {
                // Skip weekends (optional, but realistic)
                if ($currentDate->isWeekend()) {
                    $currentDate->addDay();
                    continue;
                }

                $statusRandom = rand(1, 100);
                $status = 'present';
                $notes = null;

                $shiftStart = Carbon::parse($currentDate->toDateString() . ' ' . $shiftStartStr);
                $shiftEnd = Carbon::parse($currentDate->toDateString() . ' ' . $shiftEndStr);
                
                $checkIn = null;
                $checkOut = null;

                if ($statusRandom <= 75) {
                    // Present and on time
                    $status = 'present';
                    // Arrived up to 15 mins early or 5 mins late
                    $minutesOffset = rand(-15, 5);
                    $checkIn = $shiftStart->copy()->addMinutes($minutesOffset);
                    // Left 0 to 60 mins after shift end
                    $checkOut = $shiftEnd->copy()->addMinutes(rand(0, 60));
                } elseif ($statusRandom <= 90) {
                    // Late
                    $status = 'late';
                    // Arrived 20 to 120 minutes late
                    $minutesOffset = rand(20, 120);
                    $checkIn = $shiftStart->copy()->addMinutes($minutesOffset);
                    $checkOut = $shiftEnd->copy()->addMinutes(rand(0, 60));
                    $notes = 'Retraso por tráfico pesado.';
                } elseif ($statusRandom <= 95) {
                    // Absent
                    $status = 'absent';
                    $notes = 'Falta sin justificar.';
                } else {
                    // Excused
                    $status = 'excused';
                    $notes = 'Permiso médico autorizado.';
                }

                EmployeeAttendance::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'date' => $currentDate->toDateString()
                    ],
                    [
                        'id' => Str::uuid(),
                        'check_in' => $checkIn,
                        'check_out' => $checkOut,
                        'status' => $status,
                        'notes' => $notes
                    ]
                );

                $currentDate->addDay();
            }
        }

        $this->command->info('Attendances seeded successfully for the last 30 days.');
    }
}
