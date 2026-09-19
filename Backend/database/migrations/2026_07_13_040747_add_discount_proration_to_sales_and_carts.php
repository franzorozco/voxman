<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->uuid('discount_id')->nullable();
            $table->decimal('total_discount', 10, 2)->default(0);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->uuid('discount_id')->nullable();
            $table->decimal('total_discount', 10, 2)->default(0);
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->decimal('discount_amount', 10, 2)->default(0);
        });

        Schema::table('sale_details', function (Blueprint $table) {
            $table->decimal('discount_amount', 10, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn(['discount_id', 'total_discount']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['discount_id', 'total_discount']);
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropColumn('discount_amount');
        });

        Schema::table('sale_details', function (Blueprint $table) {
            $table->dropColumn('discount_amount');
        });
    }
};
