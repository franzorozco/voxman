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
            'amount' => 'required|numeric|min:0.01|max:99999999.99',
            'payment_date' => 'required|date',
            'type' => 'required|in:withdrawal,deposit',
            'fund_source' => 'required|string|in:cash,bank',
            'notes' => 'nullable|string',
            'reference_number' => 'nullable|string',
            'payment_method' => 'nullable|string'
        ]);

        if ($request->type === 'withdrawal') {
            $owner = \App\Models\Actors\Owner::with('owner_payments')->findOrFail($request->owner_id);
            $deposits = $owner->owner_payments->where('type', 'deposit')->whereIn('status', ['paid', 'archived'])->sum('total_amount');
            $withdrawals = $owner->owner_payments->where('type', 'withdrawal')->whereIn('status', ['paid', 'archived'])->sum('total_amount');
            $available = $deposits - $withdrawals;

            if ($request->amount > $available) {
                return response()->json([
                    'message' => 'Error de validación',
                    'error' => 'Saldo insuficiente. El capital disponible del socio es Bs. ' . number_format($available, 2)
                ], 400);
            }
        }

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

    public function transfer(Request $request)
    {
        $request->validate([
            'owner_id' => 'required|uuid',
            'branch_id' => 'required|uuid|exists:branches,id',
            'from_fund' => 'required|in:cash,bank',
            'to_fund' => 'required|in:cash,bank',
            'amount' => 'required|numeric|min:0.01',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string'
        ]);

        if ($request->from_fund === $request->to_fund) {
            return response()->json(['error' => 'No se puede transferir a la misma cuenta.'], 400);
        }

        $owner = \App\Models\Actors\Owner::findOrFail($request->owner_id);
        if ($owner->user_id !== auth()->id()) {
            return response()->json(['error' => 'Solo puedes transferir fondos de tu propia cuenta.'], 403);
        }

        $balance = $this->getTreasuryBalance($request->from_fund, $request->branch_id);
        if ($balance < $request->amount) {
            $fundName = $request->from_fund === 'cash' ? 'Caja Física' : 'Cuenta Bancaria';
            return response()->json([
                'error' => "Saldo insuficiente en {$fundName} de la sucursal seleccionada para realizar la transferencia de Bs. {$request->amount}. Saldo disponible: Bs. " . number_format($balance, 2)
            ], 400);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            // 1. Withdrawal from source
            \App\Models\Finance\OwnerPayment::create([
                'owner_id' => $request->owner_id,
                'branch_id' => $request->branch_id,
                'total_amount' => $request->amount,
                'amount' => $request->amount, // needed? Wait, the model uses total_amount but maybe mutator? I'll provide both.
                'payment_date' => $request->transfer_date,
                'type' => 'withdrawal',
                'fund_source' => $request->from_fund,
                'notes' => 'TRANSFERENCIA - RETIRO: ' . ($request->notes ?: 'Transferencia entre cuentas'),
                'payment_method' => 'Transferencia Interna',
                'reference_number' => 'TRF-OUT-' . time(),
                'status' => 'paid'
            ]);

            // 2. Deposit to destination
            \App\Models\Finance\OwnerPayment::create([
                'owner_id' => $request->owner_id,
                'branch_id' => $request->branch_id,
                'total_amount' => $request->amount,
                'amount' => $request->amount,
                'payment_date' => $request->transfer_date,
                'type' => 'deposit',
                'fund_source' => $request->to_fund,
                'notes' => 'TRANSFERENCIA - INGRESO: ' . ($request->notes ?: 'Transferencia entre cuentas'),
                'payment_method' => 'Transferencia Interna',
                'reference_number' => 'TRF-IN-' . time(),
                'status' => 'paid'
            ]);
        });

        return response()->json(['message' => 'Transferencia completada correctamente.'], 201);
    }
}
