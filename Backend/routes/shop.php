<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\shop\ShopProductController;
use App\Http\Controllers\Api\shop\ShopCategoryController;
use App\Http\Controllers\Api\shop\ShopCartController;
use App\Http\Controllers\Api\shop\ShopCheckoutController;
use App\Http\Controllers\Api\shop\ShopProfileController;
use App\Http\Controllers\Api\shop\ShopShortController;
use App\Http\Controllers\Api\shop\ShopSettingsController;

/*
|--------------------------------------------------------------------------
| Shop API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your online store.
| These routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group.
|
*/

Route::prefix('v1/shop')->group(function () {
    // ── Rutas públicas de lectura con rate limiting (240 req/min por IP) ───
    // 240 y no 60: operadores móviles usan CGNAT (muchos clientes comparten IP) y
    // una sola visita al catálogo (settings + categorías + scroll infinito) hace ~10-20 requests.
    // El 3er parámetro de throttle (prefijo) separa los contadores: sin él todas las rutas
    // `throttle:N,M` comparten UN solo contador por IP.
    Route::middleware(['throttle:240,1,shop_read_'])->group(function () {
        Route::get('/settings', [ShopSettingsController::class, 'index']);
        Route::get('/products', [ShopProductController::class, 'index']);
        Route::get('/products/{slug}', [ShopProductController::class, 'show']);
        Route::get('/categories', [ShopCategoryController::class, 'index']);
        Route::get('/categories/featured', [ShopCategoryController::class, 'featured']);
    });

    // ── Devoluciones (Públicas y Privadas) ──────────────────────────────────
    Route::prefix('returns')->middleware(['throttle:30,1,shop_returns_'])->group(function () {
        Route::post('/lookup', [\App\Http\Controllers\Api\shop\ShopReturnController::class, 'lookup']);
        Route::post('/request', [\App\Http\Controllers\Api\shop\ShopReturnController::class, 'requestReturn']);
        Route::get('/guest-status', [\App\Http\Controllers\Api\shop\ShopReturnController::class, 'guestStatus']);
    });

    // Autenticación de clientes
    // Login y Register ahora usan las rutas globales /api/login y /api/register

    // Opciones de entrega
    Route::middleware(['throttle:30,1,shop_checkout_'])->group(function () {
        Route::post('/checkout/guest-init', [ShopCheckoutController::class, 'initGuestCheckout']);
        Route::get('/delivery-options/branches', [ShopCheckoutController::class, 'getAvailableBranches']);
        Route::get('/delivery-options/zones', [ShopCheckoutController::class, 'getDeliveryZones']);
    });

    // ── Rutas del carrito — con validación de token y rate limiting ─────────
    Route::prefix('cart')->middleware(['cart.token', 'throttle:120,1,shop_cart_'])->group(function () {
        Route::get('/', [ShopCartController::class, 'show']);
        Route::post('/add', [ShopCartController::class, 'add']);
        Route::post('/add-bundle', [ShopCartController::class, 'addBundle']);
        Route::put('/update', [ShopCartController::class, 'update']);
        Route::delete('/remove', [ShopCartController::class, 'remove']);
        Route::post('/validate', [ShopCartController::class, 'validateStock']);
        Route::post('/validate-code', [\App\Http\Controllers\Api\shop\ShopDiscountController::class, 'validateCode']);
        Route::post('/apply-discount', [ShopCartController::class, 'applyDiscount']);
        Route::post('/remove-discount', [ShopCartController::class, 'removeDiscount']);
    });

    // ── Rutas protegidas para clientes logueados ────────────────────────────
    Route::middleware(['auth:sanctum', 'throttle:60,1,shop_auth_'])->group(function () {
        Route::post('/logout', [ShopProfileController::class, 'logout']);
        Route::get('/profile', [ShopProfileController::class, 'profile']);
        Route::post('/customer-profile', [ShopProfileController::class, 'updateCustomerProfile']);
        Route::put('/profile/password', [ShopProfileController::class, 'changePassword']);
        Route::post('/delivery-options/add-address', [ShopProfileController::class, 'addShippingAddress']);
        Route::put('/delivery-options/addresses/{id}', [ShopProfileController::class, 'updateAddress']);
        Route::delete('/delivery-options/addresses/{id}', [ShopProfileController::class, 'deleteAddress']);
        Route::post('/checkout/auth-init', [ShopCheckoutController::class, 'initAuthCheckout']);

        // Wishlist
        Route::get('/wishlist', [\App\Http\Controllers\Api\shop\ShopWishlistController::class, 'index']);
        Route::post('/wishlist/toggle', [\App\Http\Controllers\Api\shop\ShopWishlistController::class, 'toggle']);
        Route::get('/my-orders', [ShopProfileController::class, 'myOrders']);
    });
});

