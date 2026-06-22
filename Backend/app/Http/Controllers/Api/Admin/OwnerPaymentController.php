<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Finance\OwnerPayment;

class OwnerPaymentController extends Controller
{
    public function index()
    {
        $payments = OwnerPayment::with('owner.user.profile')->orderBy('payment_date', 'desc')->get();
        $payments->map(function ($payment) {
            $payment->amount = $payment->total_amount;
            return $payment;
        });
        return response()->json($payments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'owner_id' => 'required|uuid',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'type' => 'required|in:withdrawal,deposit'
        ]);

        $data = $request->all();
        $data['total_amount'] = $request->amount;
        $data['status'] = 'paid';

        $payment = OwnerPayment::create($data);
        
        $payment->amount = $payment->total_amount;

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
            'type' => 'required|in:withdrawal,deposit'
        ]);

        $payment = OwnerPayment::findOrFail($id);
        
        $data = $request->all();
        $data['total_amount'] = $request->amount;
        
        $payment->update($data);
        
        $payment->amount = $payment->total_amount;

        return response()->json($payment->load('owner.user.profile'));
    }

    public function destroy($id)
    {
        $payment = OwnerPayment::findOrFail($id);
        $payment->delete();
        return response()->json(['message' => 'Owner payment deleted successfully']);
    }
}
