<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Actors\Customer;

class CustomerController extends Controller
{
    public function index()
    {
        return response()->json(Customer::with(['user.profile'])->where('is_active', true)->get());
    }
}
