<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
    )
->withMiddleware(function (Middleware $middleware): void {
    $middleware->api(prepend: [
    ]);
})
->withExceptions(function (Exceptions $exceptions): void {

    $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {

        return response()->json([
            'message' => 'No autenticado'
        ], 401);
    });

})
    ->create();