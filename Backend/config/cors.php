<?php

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie'
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => explode(
        ',',
        env(
            'CORS_ALLOWED_ORIGINS',
            env('FRONTEND_URL', 'http://localhost:5173')
        )
    ),

    'allowed_origins_patterns' => [
        '/https:\/\/.*\.ngrok-free\.app$/',
        '/https:\/\/.*\.trycloudflare\.com$/'
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];