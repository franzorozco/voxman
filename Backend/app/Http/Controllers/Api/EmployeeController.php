<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Actors\Employee;

class EmployeeController extends Controller
{
    public function index()
    {
        return response()->json(Employee::with(['user.profile'])->where('is_active', true)->where('status', 'active')->get());
    }
}
