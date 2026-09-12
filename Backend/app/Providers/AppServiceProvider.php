<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        \Illuminate\Auth\Notifications\ResetPassword::createUrlUsing(function ($user, string $token) {
            return env('FRONTEND_URL', 'http://localhost:5173') . '/reset-password/' . $token . '?email=' . urlencode($user->email);
        });

        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            $roles = $user->roles->pluck('name')->toArray();
            if (in_array('admin', $roles) || in_array('super_admin', $roles) || in_array('propietario', $roles) || in_array('Administrador', $roles) || in_array('Propietario', $roles) || in_array('Owner', $roles)) {
                return true;
            }
        });
    }
}
