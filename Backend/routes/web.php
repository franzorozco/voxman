<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Ruta para manejar redirecciones a la página de inicio de sesión
Route::get('/login', function () {
    return response()->json(['message' => 'Página de inicio de sesión no implementada'], 501);
})->name('login');
