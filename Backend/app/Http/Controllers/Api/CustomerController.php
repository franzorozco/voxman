<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Actors\Customer;

class CustomerController extends Controller
{
    public function index()
    {
        return response()->json(Customer::with(['user.profile'])->where('is_active', true)->get());
    }
}
