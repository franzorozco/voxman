<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductVariantController;
use App\Http\Controllers\Api\InventoryController;

use App\Http\Controllers\Api\AttributeController;
use App\Http\Controllers\Api\AttributeValueController;
use App\Http\Controllers\Api\SizeController;
use App\Http\Controllers\Api\FitController;
use App\Http\Controllers\Api\MeasurementTypeController;
use App\Http\Controllers\Api\ProductTypeMeasurementController;

use App\Http\Controllers\Api\OwnerController;
use App\Http\Controllers\Api\ProductTypeController;

Route::post('/register', RegisterController::class);
Route::post('/login', LoginController::class);

Route::middleware([
    'auth:sanctum',
    'role:Owner|Administrador'
])->prefix('v1/admin')->group(function () {

    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/report/pdf', [UserController::class, 'reportPdf']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::post('/', [UserController::class, 'store']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
        Route::get('/{id}/pdf', [UserController::class, 'pdf']);
        Route::post('/{id}/restore', [UserController::class, 'restore']);
    });

    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::get('/{id}', [RoleController::class, 'show']);
        Route::post('/', [RoleController::class, 'store']);
        Route::put('/{id}', [RoleController::class, 'update']);
        Route::delete('/{id}', [RoleController::class, 'destroy']);
    });


    Route::prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index']);
        Route::get('/{id}', [PermissionController::class, 'show']);
        Route::post('/', [PermissionController::class, 'store']);
        Route::put('/{id}', [PermissionController::class, 'update']);
        Route::delete('/{id}', [PermissionController::class, 'destroy']);
    });

    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::get('/{id}', [ProductController::class, 'show']);
        Route::post('/', [ProductController::class, 'store']);
        Route::put('/{id}', [ProductController::class, 'update']);
        Route::delete('/{id}', [ProductController::class, 'destroy']);
        Route::post('/{id}/restore', [ProductController::class, 'restore']);
    });

    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::post('/', [CategoryController::class, 'store']);
        Route::put('/{id}', [CategoryController::class, 'update']);
        Route::delete('/{id}', [CategoryController::class, 'destroy']);
    });


    Route::prefix('variants')->group(function () {
        Route::get('/{id}', [ProductVariantController::class, 'show']);
        Route::post('/', [ProductVariantController::class, 'store']);
        Route::put('/{id}', [ProductVariantController::class, 'update']);
        Route::delete('/{id}', [ProductVariantController::class, 'destroy']);
    });

    Route::prefix('inventories')->group(function () {
        Route::get('/', [InventoryController::class, 'index']);
        Route::put('/{id}', [InventoryController::class, 'update']);
    });


    Route::prefix('attributes')->group(function () {

        Route::get('/', [AttributeController::class, 'index']);
        Route::get('/{id}', [AttributeController::class, 'show']);
        Route::post('/', [AttributeController::class, 'store']);
        Route::put('/{id}', [AttributeController::class, 'update']);
        Route::delete('/{id}', [AttributeController::class, 'destroy']);
    });


    Route::prefix('attribute-values')->group(function () {

        Route::get('/', [AttributeValueController::class, 'index']);
        Route::get('/{id}', [AttributeValueController::class, 'show']);
        Route::post('/', [AttributeValueController::class, 'store']);
        Route::put('/{id}', [AttributeValueController::class, 'update']);
        Route::delete('/{id}', [AttributeValueController::class, 'destroy']);
    });


    Route::prefix('sizes')->group(function () {

        Route::get('/', [SizeController::class, 'index']);
        Route::get('/{id}', [SizeController::class, 'show']);
        Route::post('/', [SizeController::class, 'store']);
        Route::put('/{id}', [SizeController::class, 'update']);
        Route::delete('/{id}', [SizeController::class, 'destroy']);
    });


    Route::prefix('fits')->group(function () {

        Route::get('/', [FitController::class, 'index']);
        Route::get('/{id}', [FitController::class, 'show']);
        Route::post('/', [FitController::class, 'store']);
        Route::put('/{id}', [FitController::class, 'update']);
        Route::delete('/{id}', [FitController::class, 'destroy']);
    });


    Route::prefix('measurement-types')->group(function () {

        Route::get('/', [MeasurementTypeController::class, 'index']);
        Route::get('/{id}', [MeasurementTypeController::class, 'show']);
        Route::post('/', [MeasurementTypeController::class, 'store']);
        Route::put('/{id}', [MeasurementTypeController::class, 'update']);
        Route::delete('/{id}', [MeasurementTypeController::class, 'destroy']);
    });


    Route::prefix('product-type-measurements')->group(function () {

        Route::get('/', [ProductTypeMeasurementController::class, 'index']);
        Route::get('/{id}', [ProductTypeMeasurementController::class, 'show']);
        Route::post('/', [ProductTypeMeasurementController::class, 'store']);
        Route::put('/{id}', [ProductTypeMeasurementController::class, 'update']);
        Route::delete('/{id}', [ProductTypeMeasurementController::class, 'destroy']);
    });

    Route::prefix('owners')->group(function () {
        Route::get('/', [OwnerController::class, 'index']);
        Route::get('/{id}', [OwnerController::class, 'show']);
        Route::post('/', [OwnerController::class, 'store']);
        Route::put('/{id}', [OwnerController::class, 'update']);
        Route::delete('/{id}', [OwnerController::class, 'destroy']);
    });

    Route::prefix('product-types')->group(function () {
        Route::get('/', [ProductTypeController::class, 'index']);
        Route::get('/{id}', [ProductTypeController::class, 'show']);
        Route::post('/', [ProductTypeController::class, 'store']);
        Route::put('/{id}', [ProductTypeController::class, 'update']);
        Route::delete('/{id}', [ProductTypeController::class, 'destroy']);
    });


});