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
            'type' => 'required|in:withdrawal,deposit',
            'fund_source' => 'required|string|in:cash,bank',
            'notes' => 'nullable|string',
            'reference_number' => 'nullable|string',
            'payment_method' => 'nullable|string'
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
            'type' => 'required|in:withdrawal,deposit',
            'fund_source' => 'required|string|in:cash,bank',
            'notes' => 'nullable|string',
            'reference_number' => 'nullable|string',
            'payment_method' => 'nullable|string'
        ]);

        $payment = OwnerPayment::findOrFail($id);
        
        if ($payment->status !== 'paid') {
            return response()->json(['error' => 'Solo se pueden editar movimientos en estado pagado.'], 400);
        }
        if ($payment->created_at->diffInHours(now()) > 24) {
            return response()->json(['error' => 'No se puede editar un movimiento pasadas 24 horas desde su creación.'], 400);
        }
        
        $data = $request->all();
        $data['total_amount'] = $request->amount;
        
        $payment->update($data);
        
        $payment->amount = $payment->total_amount;

        return response()->json($payment->load('owner.user.profile'));
    }

    public function destroy($id)
    {
        return response()->json(['error' => 'No se puede eliminar de forma definitiva. Use Archivar o Anular.'], 400);
    }

    public function archive($id)
    {
        $payment = OwnerPayment::findOrFail($id);
        
        $payment->status = 'archived';
        $payment->save();

        return response()->json(['message' => 'Movimiento archivado. Ya no aparecerá en la lista principal pero sigue en el Kardex y contabilidad.']);
    }

    public function annul($id)
    {
        $payment = OwnerPayment::findOrFail($id);
        
        if ($payment->created_at->diffInHours(now()) > 24) {
            return response()->json(['error' => 'No se puede anular un movimiento pasadas 24 horas. Use Archivar en su lugar.'], 400);
        }

        $payment->status = 'annulled';
        $payment->save();

        return response()->json(['message' => 'Movimiento anulado exitosamente.']);
    }
}
