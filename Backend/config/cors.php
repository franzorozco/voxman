<?php

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie'
    ],

    // 🔒 Solo los métodos HTTP que realmente usamos — nunca '*'
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // 🔒 Orígenes permitidos desde .env (lista explícita, no wildcard)
    'allowed_origins' => explode(
        ',',
        env(
            'CORS_ALLOWED_ORIGINS',
            env('FRONTEND_URL', 'http://localhost:5173')
        )
    ),

    // 🔒 Túneles de desarrollo (ngrok / cloudflare): solo fuera de producción.
    // Cualquiera puede crear un subdominio *.ngrok-free.app, así que en producción
    // estos patrones permitirían a un sitio atacante hacer peticiones a la API.
    'allowed_origins_patterns' => env('APP_ENV') === 'production' ? [] : [
        '/https:\/\/.*\.ngrok-free\.app$/',
        '/https:\/\/.*\.trycloudflare\.com$/'
    ],

    // 🔒 Solo los headers que el frontend realmente envía (verificado en src/api/client.js)
    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Cart-Token',
        'X-Branch-Id',
        'X-Requested-With',
        'X-CSRF-TOKEN',
    ],

    'exposed_headers' => [],

    'max_age' => 3600, // 1 hora de caché para preflight OPTIONS

    'supports_credentials' => true,

];