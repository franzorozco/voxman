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
        Schema::table('discount_products', function (Blueprint $table) {
            $table->foreign(['discount_id'], 'discount_products_discount_id_fkey')->references(['id'])->on('discounts')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['product_id'], 'discount_products_product_id_fkey')->references(['id'])->on('products')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('discount_products', function (Blueprint $table) {
            $table->dropForeign('discount_products_discount_id_fkey');
            $table->dropForeign('discount_products_product_id_fkey');
        });
    }
};
