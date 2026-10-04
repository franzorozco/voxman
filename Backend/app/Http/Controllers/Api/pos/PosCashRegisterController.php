<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\Finance\CashRegister;
use Illuminate\Http\Request;

class PosCashRegisterController extends Controller
{
    /**
     * Check if the authenticated employee has an open cash register.
     */
    public function checkStatus(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'El usuario no es un empleado válido.'], 403);
        }

        $openRegister = CashRegister::where('employee_id', $employee->id)
            ->where('status', 'open')
            ->first();

        if ($openRegister) {
            return response()->json([
                'status' => 'open',
                'cash_register' => $openRegister,
                'branch_id' => $openRegister->branch_id,
            ]);
        }

        return response()->json([
            'status' => 'closed',
            'message' => 'No tienes ninguna caja abierta actualmente.'
        ]);
    }

    /**
     * Open a new cash register session.
     */
    public function open(Request $request)
    {
        $request->validate([
            'opening_amount' => 'required|numeric|min:0',
            'branch_id' => 'required|exists:branches,id',
        ]);

        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'El usuario no es un empleado válido.'], 403);
        }

        // Check if already open
        $openRegister = CashRegister::where('employee_id', $employee->id)
            ->where('status', 'open')
            ->first();

        if ($openRegister) {
            return response()->json([
                'message' => 'Ya tienes una caja abierta.',
                'cash_register' => $openRegister
            ], 400);
        }

        $cashRegister = new CashRegister();
        $cashRegister->employee_id = $employee->id;
        $cashRegister->branch_id = $request->branch_id;
        $cashRegister->opening_amount = $request->opening_amount;
        $cashRegister->opened_at = now();
        $cashRegister->status = 'open';
        $cashRegister->save();

        return response()->json([
            'message' => 'Caja abierta correctamente.',
            'cash_register' => $cashRegister
        ], 201);
    }

    /**
     * Close the current cash register session.
     */
    public function close(Request $request)
    {
        $request->validate([
            'closing_amount' => 'required|numeric|min:0',
        ]);

        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'El usuario no es un empleado válido.'], 403);
        }

        $openRegister = CashRegister::where('employee_id', $employee->id)
            ->where('status', 'open')
            ->first();

        if (!$openRegister) {
            return response()->json([
                'message' => 'No tienes ninguna caja abierta.'
            ], 400);
        }

        $openRegister->closing_amount = $request->closing_amount;
        $openRegister->closed_at = now();
        $openRegister->status = 'closed';
        $openRegister->save();

        return response()->json([
            'message' => 'Caja cerrada correctamente.',
            'cash_register' => $openRegister
        ]);
    }
}
