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
        Schema::table('products', function (Blueprint $table) {
            $table->foreign(['category_id'], 'products_category_id_fkey')->references(['id'])->on('categories')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['owner_id'], 'products_owner_id_fkey')->references(['id'])->on('owners')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['product_type_id'], 'products_product_type_id_fkey')->references(['id'])->on('product_types')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign('products_category_id_fkey');
            $table->dropForeign('products_owner_id_fkey');
            $table->dropForeign('products_product_type_id_fkey');
        });
    }
};
