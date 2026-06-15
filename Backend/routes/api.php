<?php

use App\Http\Controllers\Api\Admin\AttributeController;
use App\Http\Controllers\Api\Admin\AttributeValueController;
use App\Http\Controllers\Api\Admin\BranchController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\DiscountController;
use App\Http\Controllers\Api\Admin\FitController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\MeasurementTypeController;
use App\Http\Controllers\Api\Admin\OwnerController;
use App\Http\Controllers\Api\Admin\PermissionController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\ProductTypeController;
use App\Http\Controllers\Api\Admin\ProductTypeMeasurementController;
use App\Http\Controllers\Api\Admin\ProductVariantController;
use App\Http\Controllers\Api\Admin\RoleController;
use App\Http\Controllers\Api\Admin\SizeController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\BundleController;
use App\Http\Controllers\Api\Admin\GiftcardController;
use App\Http\Controllers\Api\Admin\SupplierController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\BrandController;
use Illuminate\Support\Facades\Route;

Route::post('/register', RegisterController::class);
Route::post('/login', LoginController::class);

Route::middleware([
    'auth:sanctum',
])->prefix('v1/admin')->group(function () {

    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->middleware('permission:view_users');
        Route::get('/report/pdf', [UserController::class, 'reportPdf'])->middleware('permission:view_users');
        Route::get('/deleted', [UserController::class, 'deleted'])->middleware('permission:view_users');
        Route::get('/{id}/pdf', [UserController::class, 'pdf'])->middleware('permission:view_users');
        Route::get('/{id}', [UserController::class, 'show'])->middleware('permission:view_users');
        Route::post('/', [UserController::class, 'store'])->middleware('permission:create_users');
        Route::put('/{id}', [UserController::class, 'update'])->middleware('permission:edit_users');
        Route::delete('/{id}', [UserController::class, 'destroy'])->middleware('permission:delete_users');
        Route::post('/{id}/restore', [UserController::class, 'restore'])->middleware('permission:restore_users');
        Route::delete('/{id}/force', [UserController::class, 'forceDestroy'])->middleware('permission:delete_users');
    });

    Route::prefix('roles')->middleware('permission:manage_roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::get('/{id}', [RoleController::class, 'show']);
        Route::post('/', [RoleController::class, 'store']);
        Route::put('/{id}', [RoleController::class, 'update']);
        Route::delete('/{id}', [RoleController::class, 'destroy']);
    });


    Route::prefix('permissions')->middleware('permission:manage_roles')->group(function () {
        Route::get('/', [PermissionController::class, 'index']);
        Route::get('/{id}', [PermissionController::class, 'show']);
        Route::post('/', [PermissionController::class, 'store']);
        Route::put('/{id}', [PermissionController::class, 'update']);
        Route::delete('/{id}', [PermissionController::class, 'destroy']);
    });

    Route::prefix('branches')->group(function () {
        Route::get('/', [BranchController::class, 'index'])->middleware('permission:view_branches');
        Route::get('/deleted', [BranchController::class, 'deleted'])->middleware('permission:view_branches');
        Route::post('/', [BranchController::class, 'store'])->middleware('permission:create_branches');
        Route::get('/{id}', [BranchController::class, 'show'])->middleware('permission:view_branches');
        Route::post('/{id}', [BranchController::class, 'update'])->middleware('permission:edit_branches');
        Route::delete('/{id}', [BranchController::class, 'destroy'])->middleware('permission:delete_branches');
        Route::post('/{id}/restore', [BranchController::class, 'restore'])->middleware('permission:restore_branches');
        Route::delete('/{id}/force', [BranchController::class, 'forceDestroy'])->middleware('permission:delete_branches');
    });

    Route::get('/employees', function() {
        return response()->json(\App\Models\Actors\Employee::with('user.profile')->where('is_active', true)->get());
    });

    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->middleware('permission:view_products');
        Route::get('/{id}', [ProductController::class, 'show'])->middleware('permission:view_products');
        Route::post('/', [ProductController::class, 'store'])->middleware('permission:create_products');
        Route::put('/{id}', [ProductController::class, 'update'])->middleware('permission:edit_products');
        Route::patch('/{id}/partial', [ProductController::class, 'partialUpdate'])->middleware('permission:edit_products');
        Route::post('/{id}/images', [ProductController::class, 'updateImages'])->middleware('permission:edit_products');
        Route::delete('/{id}', [ProductController::class, 'destroy'])->middleware('permission:delete_products');
        Route::post('/{id}/restore', [ProductController::class, 'restore'])->middleware('permission:restore_products');
        Route::delete('/{id}/force', [ProductController::class, 'forceDestroy'])->middleware('permission:delete_products');
        Route::post('/{id}/measurements', [ProductController::class, 'updateMeasurements'])->middleware('permission:manage_product_measurements');
    });

    Route::prefix('bundles')->group(function () {
        Route::get('/', [BundleController::class, 'index'])->middleware('permission:view_products');
        Route::get('/{id}', [BundleController::class, 'show'])->middleware('permission:view_products');
        Route::post('/', [BundleController::class, 'store'])->middleware('permission:create_products');
        Route::put('/{id}', [BundleController::class, 'update'])->middleware('permission:edit_products');
        Route::delete('/{id}', [BundleController::class, 'destroy'])->middleware('permission:delete_products');
    });

    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index'])->middleware('permission:view_categories');
        Route::post('/', [CategoryController::class, 'store'])->middleware('permission:create_categories');
        Route::put('/{id}', [CategoryController::class, 'update'])->middleware('permission:edit_categories');
        Route::delete('/{id}', [CategoryController::class, 'destroy'])->middleware('permission:delete_categories');
    });

    Route::prefix('discounts')->group(function () {
        Route::get('/', [DiscountController::class, 'index']);
        Route::get('/deleted', [DiscountController::class, 'deleted']);
        Route::get('/{id}', [DiscountController::class, 'show']);
        Route::post('/', [DiscountController::class, 'store']);
        Route::put('/{id}', [DiscountController::class, 'update']);
        Route::delete('/{id}', [DiscountController::class, 'destroy']);
        Route::post('/{id}/restore', [DiscountController::class, 'restore']);
        Route::delete('/{id}/force', [DiscountController::class, 'forceDestroy']);
    });

    Route::prefix('brands')->group(function () {
        Route::get('/', [BrandController::class, 'index']);
        Route::post('/', [BrandController::class, 'store']);
        Route::put('/{id}', [BrandController::class, 'update']);
        Route::delete('/{id}', [BrandController::class, 'destroy']);
    });


    Route::prefix('variants')->group(function () {
        Route::get('/', [ProductVariantController::class, 'index']);
        Route::get('/deleted', [ProductVariantController::class, 'deleted'])->middleware('permission:view_products');
        Route::get('/{id}', [ProductVariantController::class, 'show']);
        Route::post('/', [ProductVariantController::class, 'store']);
        Route::put('/{id}', [ProductVariantController::class, 'update']);
        Route::delete('/{id}', [ProductVariantController::class, 'destroy']);
    });

    Route::prefix('inventories')->group(function () {
        Route::get('/', [InventoryController::class, 'index'])->middleware('permission:view_inventory_own_branch|view_inventory_all_branches');
        Route::get('/movements', [InventoryController::class, 'movements'])->middleware('permission:view_inventory_history');
        Route::post('/adjust', [InventoryController::class, 'adjust'])->middleware('permission:adjust_inventory|receive_inventory');
        Route::post('/batch-adjust', [InventoryController::class, 'batchAdjust'])->middleware('permission:inventory_mass_entry');
        Route::post('/transfer', [InventoryController::class, 'transfer'])->middleware('permission:transfer_inventory');
    });


    Route::prefix('attributes')->group(function () {

        Route::get('/', [AttributeController::class, 'index']);
        Route::get('/{id}', [AttributeController::class, 'show']);
        Route::post('/', [AttributeController::class, 'store']);
        Route::put('/{id}', [AttributeController::class, 'update']);
        Route::delete('/{id}', [AttributeController::class, 'destroy']);
        Route::get('/', [ProductController::class, 'getAttributes']);
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

    Route::prefix('customers')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\Admin\CustomerController::class, 'index']);
    });

    Route::prefix('employees')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\Admin\EmployeeController::class, 'index']);
    });

    Route::prefix('giftcards')->group(function () {
        Route::get('/deleted', [GiftcardController::class, 'deleted'])->middleware('permission:view_giftcards');
        Route::put('/{id}/restore', [GiftcardController::class, 'restore'])->middleware('permission:restore_giftcards');
        Route::delete('/{id}/force', [GiftcardController::class, 'forceDestroy'])->middleware('permission:delete_giftcards');
        Route::get('/', [GiftcardController::class, 'index'])->middleware('permission:view_giftcards');
        Route::post('/', [GiftcardController::class, 'store'])->middleware('permission:create_giftcards');
        Route::post('/validate', [GiftcardController::class, 'checkBalance'])->middleware('permission:view_giftcards');
        Route::post('/digitalize', [GiftcardController::class, 'digitalize'])->middleware('permission:edit_giftcards');
        Route::post('/{id}/reload', [GiftcardController::class, 'reload'])->middleware('permission:edit_giftcards');
        Route::delete('/{id}', [GiftcardController::class, 'destroy'])->middleware('permission:delete_giftcards');
    });

    Route::prefix('suppliers')->group(function () {
        Route::get('/deleted', [SupplierController::class, 'deleted'])->middleware('permission:view_suppliers');
        Route::put('/{id}/restore', [SupplierController::class, 'restore'])->middleware('permission:restore_suppliers');
        Route::delete('/{id}/force', [SupplierController::class, 'forceDestroy'])->middleware('permission:delete_suppliers');
        
        Route::get('/', [SupplierController::class, 'index'])->middleware('permission:view_suppliers');
        Route::get('/{id}', [SupplierController::class, 'show'])->middleware('permission:view_suppliers');
        Route::post('/', [SupplierController::class, 'store'])->middleware('permission:create_suppliers');
        Route::put('/{id}', [SupplierController::class, 'update'])->middleware('permission:edit_suppliers');
        Route::delete('/{id}', [SupplierController::class, 'destroy'])->middleware('permission:delete_suppliers');
    });

});