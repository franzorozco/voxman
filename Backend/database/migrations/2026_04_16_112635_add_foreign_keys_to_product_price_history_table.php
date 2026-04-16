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
        Schema::table('product_price_history', function (Blueprint $table) {
            $table->foreign(['changed_by'], 'product_price_history_changed_by_fkey')->references(['id'])->on('users')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['variant_id'], 'product_price_history_variant_id_fkey')->references(['id'])->on('product_variants')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_price_history', function (Blueprint $table) {
            $table->dropForeign('product_price_history_changed_by_fkey');
            $table->dropForeign('product_price_history_variant_id_fkey');
        });
    }
};
