<?php

use App\Http\Controllers\Api\Admin\AttributeController;
use App\Http\Controllers\Api\Admin\AttributeValueController;
use App\Http\Controllers\Api\Admin\BranchController;
use App\Http\Controllers\Api\Admin\BundleController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\CustomerController;
use App\Http\Controllers\Api\Admin\DiscountController;
use App\Http\Controllers\Api\Admin\EmployeeController;
use App\Http\Controllers\Api\Admin\FitController;
use App\Http\Controllers\Api\Admin\GiftcardController;
use App\Http\Controllers\Api\Admin\GuestController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\MeasurementTypeController;
use App\Http\Controllers\Api\Admin\OwnerController;
use App\Http\Controllers\Api\Admin\PermissionController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\ProductTypeController;
use App\Http\Controllers\Api\Admin\ProductTypeMeasurementController;
use App\Http\Controllers\Api\Admin\ProductVariantController;
use App\Http\Controllers\Api\Admin\PurchaseController;
use App\Http\Controllers\Api\Admin\RoleController;
use App\Http\Controllers\Api\Admin\SaleController;
use App\Http\Controllers\Api\Admin\SizeController;
use App\Http\Controllers\Api\Admin\CartController;
use App\Http\Controllers\Api\Admin\SupplierController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\BrandController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Logistics\OrderNetworkController;

Route::post('/register', RegisterController::class);
Route::post('/login', LoginController::class);

// Public Order Network routes (for customers to confirm delivery via link)
Route::prefix('v1/delivery')->group(function () {
    Route::get('/{id}', [OrderNetworkController::class, 'getDeliveryDetails']);
    Route::post('/{id}/confirm', [OrderNetworkController::class, 'confirmDelivery']);
    Route::post('/{id}/notes', [OrderNetworkController::class, 'updateNotes']);
    Route::post('/{id}/apply-discount', [OrderNetworkController::class, 'applyDiscount']);
    Route::post('/{id}/remove-discount', [OrderNetworkController::class, 'removeDiscount']);
    Route::put('/{id}/recipient', [OrderNetworkController::class, 'updateRecipientInfo']);
});

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

    Route::prefix('logs')->middleware('permission:view_audit_logs')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\AuditLogController::class, 'index']);
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

    Route::prefix('checkout')->group(function () {
        Route::post('/validate-code', [\App\Http\Controllers\Api\Admin\CheckoutValidationController::class, 'validateCode']);
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
        Route::get('/stats', [InventoryController::class, 'stats'])->middleware('permission:view_inventory_own_branch|view_inventory_all_branches');
        Route::get('/movements', [InventoryController::class, 'movements'])->middleware('permission:view_inventory_history');
        Route::post('/adjust', [InventoryController::class, 'adjust'])->middleware('permission:adjust_inventory|receive_inventory');
        Route::post('/audit', [InventoryController::class, 'audit'])->middleware('permission:adjust_inventory');
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
        Route::get('/', [OwnerController::class, 'index'])->middleware('permission:view_owners');
        Route::get('/{id}/profile', [OwnerController::class, 'profile'])->middleware('permission:view_owners');
        Route::get('/{id}', [OwnerController::class, 'show'])->middleware('permission:view_owners');
        Route::post('/', [OwnerController::class, 'store'])->middleware('permission:manage_owners');
        Route::put('/{id}', [OwnerController::class, 'update'])->middleware('permission:manage_owners');
        Route::delete('/{id}', [OwnerController::class, 'destroy'])->middleware('permission:manage_owners');
    });

    Route::prefix('product-types')->group(function () {
        Route::get('/', [ProductTypeController::class, 'index']);
        Route::get('/{id}', [ProductTypeController::class, 'show']);
        Route::post('/', [ProductTypeController::class, 'store']);
        Route::put('/{id}', [ProductTypeController::class, 'update']);
        Route::delete('/{id}', [ProductTypeController::class, 'destroy']);
    });

    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'index']);
        Route::get('/kpis', [CustomerController::class, 'kpis']);
        Route::get('/deleted', [CustomerController::class, 'getDeleted']);
        Route::post('/{id}/restore', [CustomerController::class, 'restore']);
        Route::get('/search-unlinked-users', [CustomerController::class, 'searchUnlinkedUsers']);
        Route::get('/search-pos-customers', [CustomerController::class, 'searchPosCustomers']);
        Route::post('/link-user', [CustomerController::class, 'linkUser']);
        Route::get('/{id}', [CustomerController::class, 'show']);
        Route::get('/{id}/timeline', [CustomerController::class, 'getTimeline']);
        Route::put('/{id}/tags', [CustomerController::class, 'updateTags']);
        Route::post('/{id}/points', [CustomerController::class, 'adjustPoints']);
        Route::post('/', [CustomerController::class, 'store']);
        Route::put('/{id}', [CustomerController::class, 'update']);
        Route::delete('/{id}', [CustomerController::class, 'destroy']);
    });

    Route::prefix('guests')->group(function () {
        Route::get('/search', [GuestController::class, 'search']);
        Route::get('/{id}/history', [GuestController::class, 'history']);
    });

    Route::prefix('employees')->group(function () {
        Route::get('/', [EmployeeController::class, 'index']);
        Route::get('/deleted', [EmployeeController::class, 'getDeleted']);
        Route::post('/{id}/restore', [EmployeeController::class, 'restore']);
        Route::get('/{id}/stats', [EmployeeController::class, 'stats']);
        Route::get('/{id}', [EmployeeController::class, 'show']);
        Route::post('/', [EmployeeController::class, 'store']);
        Route::put('/{id}', [EmployeeController::class, 'update']);
        Route::delete('/{id}', [EmployeeController::class, 'destroy']);
        Route::delete('/{id}/force', [EmployeeController::class, 'forceDestroy']);
        Route::post('/{id}/permissions', [EmployeeController::class, 'assignPermission']);
        Route::delete('/{id}/permissions', [EmployeeController::class, 'revokePermission']);
        Route::post('/{id}/role', [EmployeeController::class, 'assignRole']);
    });

    Route::prefix('attendances')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\EmployeeAttendanceController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Admin\EmployeeAttendanceController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\Api\Admin\EmployeeAttendanceController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\Admin\EmployeeAttendanceController::class, 'destroy']);
        Route::post('/check-in', [\App\Http\Controllers\Api\Admin\EmployeeAttendanceController::class, 'checkIn']);
        Route::post('/check-out', [\App\Http\Controllers\Api\Admin\EmployeeAttendanceController::class, 'checkOut']);
        Route::get('/status/{employeeId}', [\App\Http\Controllers\Api\Admin\EmployeeAttendanceController::class, 'status']);
    });
    Route::prefix('payroll')->group(function () {
        Route::get('/history', [\App\Http\Controllers\Api\Admin\EmployeePaymentController::class, 'history']);
        Route::post('/calculate', [\App\Http\Controllers\Api\Admin\EmployeePaymentController::class, 'calculate']);
        Route::post('/pay', [\App\Http\Controllers\Api\Admin\EmployeePaymentController::class, 'store']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\Admin\EmployeePaymentController::class, 'destroy']);
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
        
        Route::get('/stats', [SupplierController::class, 'stats'])->middleware('permission:view_suppliers');
        Route::get('/', [SupplierController::class, 'index'])->middleware('permission:view_suppliers');
        Route::get('/{id}/profile', [SupplierController::class, 'profile'])->middleware('permission:view_suppliers');
        Route::get('/{id}', [SupplierController::class, 'show'])->middleware('permission:view_suppliers');
        Route::post('/', [SupplierController::class, 'store'])->middleware('permission:create_suppliers');
        Route::put('/{id}', [SupplierController::class, 'update'])->middleware('permission:edit_suppliers');
        Route::delete('/{id}', [SupplierController::class, 'destroy'])->middleware('permission:delete_suppliers');
    });

    Route::prefix('purchases')->group(function () {
        Route::get('/stats', [PurchaseController::class, 'stats'])->middleware('permission:view_purchases');
        Route::get('/', [PurchaseController::class, 'index'])->middleware('permission:view_purchases');
        Route::get('/{id}', [PurchaseController::class, 'show'])->middleware('permission:view_purchases');
        Route::post('/', [PurchaseController::class, 'store'])->middleware('permission:create_purchases');
        Route::put('/{id}/cancel', [PurchaseController::class, 'cancel'])->middleware('permission:cancel_purchases');
        Route::put('/{id}/update-costs', [PurchaseController::class, 'updateCosts'])->middleware('permission:edit_purchases');
        Route::post('/{id}/pay', [\App\Http\Controllers\Api\Admin\AccountsPayableController::class, 'storePayment'])->middleware('permission:create_purchases');
        Route::post('/reception', [\App\Http\Controllers\Api\Admin\PurchaseReceptionController::class, 'store'])->middleware('permission:receive_inventory');
    });

    Route::prefix('accounts-payable')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\Admin\AccountsPayableController::class, 'stats'])->middleware('permission:view_purchases');
        Route::get('/', [\App\Http\Controllers\Api\Admin\AccountsPayableController::class, 'index'])->middleware('permission:view_purchases');
    });

    Route::prefix('quarantine')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\QuarantineController::class, 'index']); // Sin permiso por ahora
        Route::post('/{id}/resolve', [\App\Http\Controllers\Api\Admin\QuarantineController::class, 'resolve']); // Sin permiso por ahora
    });
    
    Route::prefix('sales')->group(function () {
        Route::get('/', [SaleController::class, 'index'])->middleware('permission:view_sales');
        Route::get('/{id}', [SaleController::class, 'show'])->middleware('permission:view_sales');
        Route::put('/{id}', [SaleController::class, 'update'])->middleware('permission:manage_sales');
        Route::delete('/{id}', [SaleController::class, 'destroy'])->middleware('permission:manage_sales');
        Route::put('/{id}/status', [\App\Http\Controllers\Api\Admin\SaleController::class, 'updateStatus'])->middleware('permission:manage_sales|edit_sale_notes');
        Route::post('/{id}/cancel', [\App\Http\Controllers\Api\Admin\SaleController::class, 'cancel'])->middleware('permission:manage_sales');
    });

    Route::prefix('carts')->group(function () {
        Route::get('/', [CartController::class, 'index'])->middleware('permission:view_carts');
        Route::post('/', [CartController::class, 'store'])->middleware('permission:create_carts');
        Route::get('/{id}', [CartController::class, 'show'])->middleware('permission:view_carts');
        Route::put('/{id}', [CartController::class, 'update'])->middleware('permission:edit_carts');
        Route::post('/{id}/convert', [CartController::class, 'convert'])->middleware('permission:convert_carts');
        Route::post('/{id}/reminder', [CartController::class, 'sendReminder'])->middleware('permission:send_cart_reminders');
        Route::delete('/{id}', [CartController::class, 'destroy'])->middleware('permission:delete_carts');
    });

    Route::prefix('returns')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\ReturnController::class, 'index'])->middleware('permission:view_returns');
        Route::post('/', [\App\Http\Controllers\Api\Admin\ReturnController::class, 'store'])->middleware('permission:create_returns');
        Route::get('/{id}', [\App\Http\Controllers\Api\Admin\ReturnController::class, 'show'])->middleware('permission:view_returns');
        Route::post('/{id}/approve', [\App\Http\Controllers\Api\Admin\ReturnController::class, 'approve'])->middleware('permission:manage_returns');
        Route::post('/{id}/reject', [\App\Http\Controllers\Api\Admin\ReturnController::class, 'reject'])->middleware('permission:manage_returns');
    });
    Route::prefix('cashflow')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\CashFlowController::class, 'index'])->middleware('permission:view_cashflow');
        Route::post('/transfer', [\App\Http\Controllers\Api\Admin\CashFlowController::class, 'transfer'])->middleware('permission:manage_cashflow');
        Route::post('/register/open', [\App\Http\Controllers\Api\Admin\CashFlowController::class, 'openRegister'])->middleware('permission:manage_cashflow');
        Route::post('/register/close', [\App\Http\Controllers\Api\Admin\CashFlowController::class, 'closeRegister'])->middleware('permission:manage_cashflow');
        Route::post('/adjustment', [\App\Http\Controllers\Api\Admin\CashFlowController::class, 'addAdjustment'])->middleware('permission:manage_cashflow');
    });
    
    Route::get('supplier-returns', [\App\Http\Controllers\Api\Admin\SupplierReturnController::class, 'index']);

    Route::prefix('finance')->group(function () {
        Route::get('dashboard', [\App\Http\Controllers\Api\Admin\FinanceDashboardController::class, 'index'])->middleware('permission:view_finance');
        Route::get('owners/{id}/ledger', [\App\Http\Controllers\Api\Admin\FinanceDashboardController::class, 'ownerLedger'])->middleware('permission:view_finance');
        Route::get('reports', [\App\Http\Controllers\Api\Admin\FinanceReportController::class, 'index'])->middleware('permission:view_finance_reports');
        
        Route::prefix('expenses')->middleware('permission:manage_expenses')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\Admin\ExpenseController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\Admin\ExpenseController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Api\Admin\ExpenseController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Api\Admin\ExpenseController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\Admin\ExpenseController::class, 'destroy']);
            
            Route::post('/{id}/archive', [\App\Http\Controllers\Api\Admin\ExpenseController::class, 'archive']);
            Route::post('/{id}/annul', [\App\Http\Controllers\Api\Admin\ExpenseController::class, 'annul']);
            
            Route::post('/splits/{id}/pay', [\App\Http\Controllers\Api\Admin\ExpenseController::class, 'paySplit']);
        });

        Route::prefix('owner-payments')->middleware('permission:manage_owner_payments')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\Admin\OwnerPaymentController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\Admin\OwnerPaymentController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Api\Admin\OwnerPaymentController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Api\Admin\OwnerPaymentController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\Admin\OwnerPaymentController::class, 'destroy']);
            
            Route::post('/transfer', [\App\Http\Controllers\Api\Admin\OwnerPaymentController::class, 'transfer']);
            Route::post('/{id}/archive', [\App\Http\Controllers\Api\Admin\OwnerPaymentController::class, 'archive']);
            Route::post('/{id}/annul', [\App\Http\Controllers\Api\Admin\OwnerPaymentController::class, 'annul']);
        });
    });

    // Order Network Admin Routes
    Route::prefix('order-network')->group(function () {
        Route::get('/', [OrderNetworkController::class, 'index'])->middleware('permission:view_orders|view_orders_own_branch|view_orders_all_branches');
        Route::get('/delivery-zones', [OrderNetworkController::class, 'getDeliveryZones'])->middleware('permission:view_orders|view_orders_own_branch|view_orders_all_branches');
        Route::get('/destinations', [OrderNetworkController::class, 'getDestinations'])->middleware('permission:view_orders|view_orders_own_branch|view_orders_all_branches');
        Route::post('/delivery-zones', [OrderNetworkController::class, 'createDeliveryZone'])->middleware('permission:manage_settings');
        Route::put('/delivery-zones/{id}', [OrderNetworkController::class, 'updateDeliveryZone'])->middleware('permission:manage_settings');
        Route::get('/drivers', [OrderNetworkController::class, 'getDrivers'])->middleware('permission:view_orders|view_orders_own_branch|view_orders_all_branches');
        Route::post('/convert', [OrderNetworkController::class, 'convertToOrder'])->middleware('permission:create_orders');
        Route::post('/{id}/status', [OrderNetworkController::class, 'updateStatus'])->middleware('permission:update_order_status');
        Route::post('/{id}/share-checkout', [OrderNetworkController::class, 'shareCheckoutSession'])->middleware('permission:edit_orders');
        Route::post('/{id}/apply-discount', [OrderNetworkController::class, 'applyDiscount'])->middleware('permission:manage_order_discounts');
        Route::put('/{id}/details', [OrderNetworkController::class, 'updateDeliveryDetails'])->middleware('permission:edit_orders');
        Route::put('/{id}/order', [OrderNetworkController::class, 'updateOrder'])->middleware('permission:edit_orders');
        Route::post('/{id}/driver', [OrderNetworkController::class, 'assignDriver'])->middleware('permission:assign_orders');
        Route::post('/{id}/remove-discount', [OrderNetworkController::class, 'removeDiscount'])->middleware('permission:manage_order_discounts');
        Route::post('/{id}/item', [OrderNetworkController::class, 'addItem'])->middleware('permission:manage_order_items');
        Route::delete('/{id}/item/{detailId}', [OrderNetworkController::class, 'removeItem'])->middleware('permission:manage_order_items');
        Route::post('/{id}/item/{detailId}/restore', [OrderNetworkController::class, 'restoreItem'])->middleware('permission:manage_order_items');
        Route::post('/{id}/toggle-recipient-edit', [OrderNetworkController::class, 'toggleRecipientEdit'])->middleware('permission:edit_orders');
        Route::delete('/{id}', [OrderNetworkController::class, 'cancelOrder'])->middleware('permission:cancel_orders');
    });

});

/* =========================================================
   RUTAS DEL PUNTO DE VENTA (POS)
========================================================= */
Route::middleware([
    'auth:sanctum',
    'pos.access'
])->prefix('v1/pos')->group(function () {
    
    // Aquí irán las rutas específicas del POS como:
    // Route::get('/products', [PosProductController::class, 'index']);
    // Route::post('/checkout', [PosSaleController::class, 'store']);
    // Route::post('/cash-register/open', [PosCashRegisterController::class, 'open']);
    
});