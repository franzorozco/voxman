<?php

use Laravel\Sanctum\Sanctum;

return [

    'stateful' => explode(',', env(
        'SANCTUM_STATEFUL_DOMAINS',
        ''
    )),

    'guard' => ['web'],

    'expiration' => 60 * 24 * 30, // 30 días: respaldo global; los tokens sin expiración propia nunca caducaban

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' =>
            Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,

        'encrypt_cookies' =>
            Illuminate\Cookie\Middleware\EncryptCookies::class,

        'validate_csrf_token' =>
            Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],

];