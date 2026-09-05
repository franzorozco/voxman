<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\shop\ShopProductController;
use App\Http\Controllers\Api\shop\ShopCategoryController;
use App\Http\Controllers\Api\shop\ShopCartController;
use App\Http\Controllers\Api\shop\ShopCheckoutController;
use App\Http\Controllers\Api\shop\ShopAuthController;
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
    // Rutas públicas
    Route::get('/settings', [ShopSettingsController::class, 'index']);
    Route::get('/products', [ShopProductController::class, 'index']);
    Route::get('/products/{slug}', [ShopProductController::class, 'show']);
    
    Route::get('/categories', [ShopCategoryController::class, 'index']);

    Route::get('/shorts', [ShopShortController::class, 'index']);
    
    // Autenticación de clientes
    // Login y Register ahora usan las rutas globales /api/login y /api/register

    // Rutas del checkout (Guest & User)
    Route::post('/checkout/guest-init', [ShopCheckoutController::class, 'initGuestCheckout']);

    // Opciones de entrega
    Route::get('/delivery-options/branches', [ShopCheckoutController::class, 'getAvailableBranches']);
    Route::get('/delivery-options/zones', [ShopCheckoutController::class, 'getDeliveryZones']);

    // Rutas del carrito (Protegidas por Cart Token manual vía Interceptor)
    Route::prefix('cart')->group(function () {
        // En un caso real, un middleware específico podría verificar el X-Cart-Token
        Route::get('/', [ShopCartController::class, 'show']);
        Route::post('/add', [ShopCartController::class, 'add']);
        Route::post('/add-bundle', [ShopCartController::class, 'addBundle']);
        Route::put('/update', [ShopCartController::class, 'update']);
        Route::delete('/remove', [ShopCartController::class, 'remove']);
        Route::post('/validate', [ShopCartController::class, 'validateStock']);
        Route::post('/validate-code', [\App\Http\Controllers\Api\shop\ShopDiscountController::class, 'validateCode']);
        Route::post('/apply-discount', [ShopCartController::class, 'applyDiscount']);
        Route::post('/remove-discount', [ShopCartController::class, 'removeDiscount']);
        Route::post('/checkout', [ShopCheckoutController::class, 'process']);
    });

    // Rutas protegidas para clientes logueados
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/logout', [ShopAuthController::class, 'logout']);
        Route::get('/profile', [ShopAuthController::class, 'profile']);
        Route::post('/customer-profile', [ShopAuthController::class, 'updateCustomerProfile']);
        Route::post('/delivery-options/add-address', [ShopAuthController::class, 'addShippingAddress']);
        Route::post('/checkout/auth-init', [ShopCheckoutController::class, 'initAuthCheckout']);
        // Historial de compras, wishlist, etc.
    });
});
