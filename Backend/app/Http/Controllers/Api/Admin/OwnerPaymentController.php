<?php

namespace App\Http\Controllers\Api\Admin\Finance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Finance\OwnerPayment;

class OwnerPaymentController extends Controller
{
    public function index()
    {
        $payments = OwnerPayment::with('owner.user.profile')->orderBy('payment_date', 'desc')->get();
        return response()->json($payments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'owner_id' => 'required|uuid',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_method' => 'nullable|string|max:50',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'type' => 'required|in:withdrawal,deposit'
        ]);

        $payment = OwnerPayment::create($request->all());

        return response()->json($payment->load('owner.user.profile'), 201);
    }

    public function show($id)
    {
        $payment = OwnerPayment::with('owner.user.profile')->findOrFail($id);
        return response()->json($payment);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'owner_id' => 'required|uuid',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_method' => 'nullable|string|max:50',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'type' => 'required|in:withdrawal,deposit'
        ]);

        $payment = OwnerPayment::findOrFail($id);
        $payment->update($request->all());

        return response()->json($payment->load('owner.user.profile'));
    }

    public function destroy($id)
    {
        $payment = OwnerPayment::findOrFail($id);
        $payment->delete();
        return response()->json(['message' => 'Owner payment deleted successfully']);
    }
}
