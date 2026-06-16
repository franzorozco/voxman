<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Actors\Employee;

class EmployeeController extends Controller
{
    public function index()
    {
        return response()->json(Employee::with(['user.user_profiles'])->where('status', 'active')->get());
    }
}
