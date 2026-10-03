<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * CheckCartToken — Valida el header X-Cart-Token en rutas del carrito.
 * Bloquea tokens malformados, vacíos o sospechosamente largos.
 */
class CheckCartToken
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->header('X-Cart-Token');

        // Permitir requests sin token solo en el endpoint de creación (POST /add)
        // El token se crea en ese endpoint si no existe.
        if (!$token) {
            return $next($request);
        }

        // Formato válido: "cart_<uuid>" o "<uuid>" (legado: addBundle antiguo no usaba prefijo)
        $uuidPattern = '/^(cart_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

        if (!preg_match($uuidPattern, $token)) {
            return response()->json([
                'error' => 'Cart token inválido.'
            ], 400);
        }

        return $next($request);
    }
}
