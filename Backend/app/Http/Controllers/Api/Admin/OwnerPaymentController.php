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
            
            $totalSales = \App\Models\Sales\SaleDetail::where('owner_id', $owner->id)
                ->whereHas('sale', function($q) {
                    $q->where('status', 'paid');
                })->sum('subtotal');

            $totalExpenses = \App\Models\Finance\ExpenseSplit::where('owner_id', $owner->id)
                ->whereIn('status', ['paid', 'archived'])
                ->sum('amount');

            $available = ($deposits - $withdrawals) + ($totalSales - $totalExpenses);

            if ($request->amount > $available) {
                return response()->json([
                    'message' => 'Error de validación',
                    'error' => 'Saldo insuficiente. El capital disponible del socio es Bs. ' . number_format($available, 2)
                ], 400);
            }
        }

        $data = $request->all();
        if (isset($data['branch_id']) && $data['branch_id'] === 'na') {
            $data['branch_id'] = null;
        }
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
            'branch_id' => 'required',
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

        $branchId = $request->branch_id === 'na' ? null : $request->branch_id;

        $balance = $this->getTreasuryBalance($request->from_fund, $branchId);
        if ($balance < $request->amount) {
            $fundName = $request->from_fund === 'cash' ? 'Caja Física' : 'Cuenta Bancaria';
            return response()->json([
                'error' => "Saldo insuficiente en {$fundName} de la sucursal seleccionada para realizar la transferencia de Bs. {$request->amount}. Saldo disponible: Bs. " . number_format($balance, 2)
            ], 400);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $branchId) {
            // 1. Withdrawal from source
            \App\Models\Finance\OwnerPayment::create([
                'owner_id' => $request->owner_id,
                'branch_id' => $branchId,
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
                'branch_id' => $branchId,
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

    protected function getTreasuryBalance($type, $branchId = null) {
        $cashMethod = \App\Models\Finance\PaymentMethod::where('name', 'Efectivo')->first();
        $cashMethodId = $cashMethod ? $cashMethod->id : null;
        
        $applyBranch = function($query) use ($branchId) {
            if ($branchId) {
                if (method_exists($query->getModel(), 'sale')) {
                    $query->whereHas('sale', function($q) use ($branchId) {
                        $q->where('branch_id', $branchId);
                    });
                } else if (\Illuminate\Support\Facades\Schema::hasColumn($query->getModel()->getTable(), 'branch_id')) {
                    $query->where('branch_id', $branchId);
                } else if ($query->getModel() instanceof \App\Models\Finance\ExpenseSplit) {
                    $query->whereHas('expense', function($q) use ($branchId) {
                        $q->where('branch_id', $branchId);
                    });
                }
            } else if ($branchId === null && func_num_args() > 0) {
                 // If null is explicitly passed for branch (meaning N/A), we must query whereNull
                 // Actually this $applyBranch doesn't get called with 'null' as a literal 'filter by null'
                 // wait, if $branchId is strictly null (not omitted), it just bypasses the if ($branchId)
                 // and doesn't filter, which means it returns GLOBAL balance!
                 // BUT WAIT! In transfer, if they select "N/A" (branchId = null), they want to check the balance of N/A!
                 // If `if ($branchId)` is false, it returns global! That's a BUG in getTreasuryBalance!
            }
            return $query;
        };
        
        // Wait, to properly support branchId === null for N/A branch:
        $applyBranchFixed = function($query) use ($branchId) {
            // We only apply filter if we're looking at a specific branch OR N/A branch.
            // If we're looking at N/A branch, $branchId is null.
            // But how do we distinguish between "no filter" and "filter by null"?
            // In these controllers, we always pass branchId explicitly if we want to filter.
            // Let's use strict filtering:
            if (func_num_args() > 0) { // But we are in a closure. We can just check if we want to filter by null.
                if (method_exists($query->getModel(), 'sale')) {
                    $query->whereHas('sale', function($q) use ($branchId) {
                        $branchId ? $q->where('branch_id', $branchId) : $q->whereNull('branch_id');
                    });
                } else if (\Illuminate\Support\Facades\Schema::hasColumn($query->getModel()->getTable(), 'branch_id')) {
                    $branchId ? $query->where('branch_id', $branchId) : $query->whereNull('branch_id');
                } else if ($query->getModel() instanceof \App\Models\Finance\ExpenseSplit) {
                    $query->whereHas('expense', function($q) use ($branchId) {
                        $branchId ? $q->where('branch_id', $branchId) : $q->whereNull('branch_id');
                    });
                }
            }
            return $query;
        };

        if ($type === 'cash') {
            $sales = $cashMethodId ? $applyBranchFixed(\App\Models\Finance\Payment::where('payment_method_id', $cashMethodId))->sum('amount') : 0;
            $expenses = $applyBranchFixed(\App\Models\Finance\Expense::whereIn('status', ['paid', 'archived'])->where('fund_source', 'cash'))->sum('amount');
            $splitExpenses = $applyBranchFixed(\App\Models\Finance\ExpenseSplit::whereIn('status', ['paid', 'archived'])->where('deducted_from_wallet', true)->where('fund_source', 'cash'))->sum('amount');
            $deposits = $applyBranchFixed(\App\Models\Finance\OwnerPayment::where('type', 'deposit')->where('fund_source', 'cash'))->sum('total_amount');
            $withdrawals = $applyBranchFixed(\App\Models\Finance\OwnerPayment::where('type', 'withdrawal')->where('fund_source', 'cash'))->sum('total_amount');
            return $sales + $deposits - $expenses - $splitExpenses - $withdrawals;
        } elseif ($type === 'bank') {
            if ($cashMethodId) {
                $giftcardMethodIds = \App\Models\Finance\PaymentMethod::where('name', 'ILIKE', '%giftcard%')->pluck('id')->toArray();
                $bankQuery = \App\Models\Finance\Payment::where('payment_method_id', '!=', $cashMethodId);
                if (!empty($giftcardMethodIds)) {
                    $bankQuery->whereNotIn('payment_method_id', $giftcardMethodIds);
                }
                $sales = $applyBranchFixed($bankQuery)->sum('amount');
            } else {
                $sales = $applyBranchFixed(\App\Models\Finance\Payment::query())->sum('amount');
            }
            $expenses = $applyBranchFixed(\App\Models\Finance\Expense::whereIn('status', ['paid', 'archived'])->where('fund_source', 'bank'))->sum('amount');
            $splitExpenses = $applyBranchFixed(\App\Models\Finance\ExpenseSplit::whereIn('status', ['paid', 'archived'])->where('deducted_from_wallet', true)->where('fund_source', 'bank'))->sum('amount');
            $deposits = $applyBranchFixed(\App\Models\Finance\OwnerPayment::where('type', 'deposit')->where('fund_source', 'bank'))->sum('total_amount');
            $withdrawals = $applyBranchFixed(\App\Models\Finance\OwnerPayment::where('type', 'withdrawal')->where('fund_source', 'bank'))->sum('total_amount');
            return $sales + $deposits - $expenses - $splitExpenses - $withdrawals;
        }
        return 0;
    }
}
