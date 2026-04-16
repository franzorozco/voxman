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
        Schema::table('discount_categories', function (Blueprint $table) {
            $table->foreign(['category_id'], 'discount_categories_category_id_fkey')->references(['id'])->on('categories')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['discount_id'], 'discount_categories_discount_id_fkey')->references(['id'])->on('discounts')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('discount_categories', function (Blueprint $table) {
            $table->dropForeign('discount_categories_category_id_fkey');
            $table->dropForeign('discount_categories_discount_id_fkey');
        });
    }
};
