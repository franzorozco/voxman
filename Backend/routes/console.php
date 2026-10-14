<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('carts:cleanup-expired')->everyMinute();

// Limpia tokens de sesión caducados (cada login crea un token)
Schedule::command('sanctum:prune-expired --hours=24')->daily();

// Elimina físicamente cuentas web sin verificar tras 24 horas para liberar el correo sin bloqueo de 60 días
Schedule::command('users:cleanup-unverified')->hourly();

