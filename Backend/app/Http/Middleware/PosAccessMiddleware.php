<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PosAccessMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        // Si no está autenticado, no debería llegar aquí si usa auth:sanctum
        if (!$user) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        // 1. Validar si tiene permiso global (Dueños/Admins)
        if ($user->can('sell_all_branches')) {
            // El frontend debe enviar la sucursal en el header o body
            $branchId = $request->header('X-Branch-Id') ?? $request->input('branch_id');
            
            if (!$branchId) {
                return response()->json(['message' => 'Debe seleccionar una sucursal para operar en el POS'], 403);
            }
            
            // Inyectar el branch_id en la request para que los controladores no tengan que buscarlo
            $request->merge(['pos_branch_id' => $branchId]);
            return $next($request);
        }

        // 2. Validar si tiene permiso local (Empleados)
        if ($user->can('sell_own_branch')) {
            $employee = $user->employee;
            
            if (!$employee) {
                return response()->json(['message' => 'Su usuario no está registrado como empleado'], 403);
            }

            if (!$employee->branch_id) {
                return response()->json(['message' => 'No tiene una sucursal asignada'], 403);
            }

            // Inyectar el branch_id forzosamente ignorando lo que envíe el cliente
            $request->merge(['pos_branch_id' => $employee->branch_id]);
            return $next($request);
        }

        // Si no tiene ninguno de los dos permisos
        return response()->json(['message' => 'No tiene permisos para operar el Punto de Venta'], 403);
    }
}
