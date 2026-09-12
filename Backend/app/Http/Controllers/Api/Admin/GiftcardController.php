<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Finance\Giftcard;
use App\Models\Finance\GiftcardTransaction;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class GiftcardController extends Controller
{
    // List all giftcards (with search)
    public function index(Request $request)
    {
        $query = Giftcard::with(['customer.user.profile', 'purchaser.user.profile', 'transactions.sale']);
        
        if ($request->filled('search')) {
            $query->where('code', 'LIKE', "%{$request->search}%");
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        return response()->json($query->paginate(15));
    }

    // Sell/Issue a new giftcard
    public function store(Request $request)
    {
        $request->validate([
            'code' => ['required', 'regex:/^VOX-\d{6}$/', 'unique:giftcards,code'],
            'amount' => 'required|numeric|min:50',
            'purchaser_id' => 'nullable|uuid|exists:customers,id',
            'expires_at' => 'nullable|date',
        ]);

        DB::beginTransaction();
        try {
            $giftcard = Giftcard::create([
                'id' => Str::uuid(),
                'code' => $request->code,
                'initial_balance' => $request->amount,
                'current_balance' => $request->amount,
                'purchaser_id' => $request->purchaser_id,
                'expires_at' => $request->expires_at ? \Carbon\Carbon::parse($request->expires_at) : null,
                'is_active' => true,
                'is_digitalized' => false,
            ]);

            GiftcardTransaction::create([
                'id' => Str::uuid(),
                'giftcard_id' => $giftcard->id,
                'type' => 'issue',
                'amount' => $request->amount,
                'notes' => 'Emisión inicial de Giftcard',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Giftcard generada correctamente',
                'giftcard' => $giftcard
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al generar Giftcard', 'error' => $e->getMessage()], 500);
        }
    }

    // Reload existing giftcard
    public function reload(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        DB::beginTransaction();
        try {
            $giftcard = Giftcard::findOrFail($id);
            $giftcard->current_balance += $request->amount;
            $giftcard->save();

            GiftcardTransaction::create([
                'id' => Str::uuid(),
                'giftcard_id' => $giftcard->id,
                'type' => 'reload',
                'amount' => $request->amount,
                'notes' => 'Recarga de saldo',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Giftcard recargada correctamente',
                'giftcard' => $giftcard
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al recargar Giftcard', 'error' => $e->getMessage()], 500);
        }
    }

    // Check balance / Validate
    public function checkBalance(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        $giftcard = Giftcard::where('code', $request->code)->first();

        if (!$giftcard) {
            return response()->json(['message' => 'Código de Giftcard inválido o no existe'], 404);
        }

        if (!$giftcard->is_active) {
            return response()->json(['message' => 'La Giftcard está inactiva'], 400);
        }

        if ($giftcard->expires_at && now()->greaterThan($giftcard->expires_at)) {
            return response()->json(['message' => 'La Giftcard ha expirado'], 400);
        }

        return response()->json([
            'valid' => true,
            'giftcard' => $giftcard
        ]);
    }

    // Digitalize giftcard (link to customer)
    public function digitalize(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'customer_id' => 'required|uuid|exists:customers,id'
        ]);

        DB::beginTransaction();
        try {
            $giftcard = Giftcard::where('code', $request->code)->first();

            if (!$giftcard) {
                return response()->json(['message' => 'Código de Giftcard inválido'], 404);
            }
            if (!$giftcard->is_active) {
                return response()->json(['message' => 'La Giftcard está inactiva'], 400);
            }
            if ($giftcard->is_digitalized) {
                return response()->json(['message' => 'La Giftcard ya fue digitalizada y vinculada a una cuenta'], 400);
            }

            $giftcard->is_digitalized = true;
            $giftcard->customer_id = $request->customer_id;
            $giftcard->save();

            DB::commit();

            return response()->json([
                'message' => 'Giftcard digitalizada correctamente',
                'giftcard' => $giftcard
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al digitalizar Giftcard', 'error' => $e->getMessage()], 500);
        }
    }

    // Disable a giftcard
    public function destroy($id)
    {
        $giftcard = Giftcard::findOrFail($id);
        $giftcard->is_active = false;
        $giftcard->save();
        $giftcard->delete();

        return response()->json(['message' => 'Giftcard desactivada y eliminada']);
    }

    public function deleted()
    {
        $giftcards = Giftcard::onlyTrashed()->with(['customer', 'purchaser'])->get();
        return response()->json($giftcards);
    }

    public function restore($id)
    {
        $giftcard = Giftcard::onlyTrashed()->findOrFail($id);
        $giftcard->restore();
        $giftcard->is_active = true;
        $giftcard->save();

        return response()->json(['message' => 'Giftcard restaurada']);
    }

    public function forceDestroy($id)
    {
        $giftcard = Giftcard::onlyTrashed()->findOrFail($id);
        $giftcard->forceDelete();

        return response()->json(['message' => 'Giftcard eliminada permanentemente']);
    }
}
