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
        Schema::table('sale_details', function (Blueprint $table) {
            $table->foreign(['owner_id'], 'sale_details_owner_id_fkey')->references(['id'])->on('owners')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['sale_id'], 'sale_details_sale_id_fkey')->references(['id'])->on('sales')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['variant_id'], 'sale_details_variant_id_fkey')->references(['id'])->on('product_variants')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_details', function (Blueprint $table) {
            $table->dropForeign('sale_details_owner_id_fkey');
            $table->dropForeign('sale_details_sale_id_fkey');
            $table->dropForeign('sale_details_variant_id_fkey');
        });
    }
};
