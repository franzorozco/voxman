<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Finance\AccountsPayable;
use App\Models\Finance\SupplierPayment;
use App\Models\Purchase\Purchase;

class AccountsPayableController extends Controller
{
    /**
     * Store a new payment for a purchase.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string $purchase_id
     * @return \Illuminate\Http\JsonResponse
     */
    public function storePayment(Request $request, $purchase_id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => 'nullable|uuid|exists:payment_methods,id',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            $account = AccountsPayable::where('purchase_id', $purchase_id)->first();

            if (!$account) {
                return response()->json(['message' => 'No existe una cuenta por pagar para esta compra. La compra debe ser recepcionada primero.'], 400);
            }

            if ($account->status === 'paid' || $account->balance <= 0) {
                return response()->json(['message' => 'Esta cuenta ya está totalmente pagada.'], 400);
            }

            $amount = $request->amount;
            
            // Si el monto a pagar es mayor al balance, lo ajustamos o lanzamos error.
            if ($amount > $account->balance) {
                return response()->json(['message' => 'El monto del abono no puede ser mayor al saldo pendiente.'], 400);
            }

            // Crear el registro del pago
            $payment = SupplierPayment::create([
                'id' => Str::uuid(),
                'supplier_id' => $account->supplier_id,
                'purchase_id' => $purchase_id,
                'amount' => $amount,
                'payment_method_id' => $request->payment_method_id,
                'status' => 'completed',
                'created_at' => now()
            ]);

            // Actualizar la cuenta por pagar
            $account->paid_amount += $amount;
            $account->balance -= $amount;

            if ($account->balance <= 0) {
                $account->status = 'paid';
                $account->balance = 0; // Fix floating point issues
            } else {
                $account->status = 'partial';
            }
            
            $account->save();

            // Guardar notas en la compra si se envió
            if ($request->notes) {
                $purchase = Purchase::find($purchase_id);
                if ($purchase) {
                    $purchase->notes = $purchase->notes . "\n[Pago] " . now()->format('Y-m-d') . ": Bs " . $amount . " - " . $request->notes;
                    $purchase->save();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Pago registrado exitosamente.',
                'payment' => $payment,
                'account' => $account
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al procesar el pago.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
