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
        Schema::table('inventories', function (Blueprint $table) {
            $table->foreign(['branch_id'], 'inventories_branch_id_fkey')->references(['id'])->on('branches')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['variant_id'], 'inventories_variant_id_fkey')->references(['id'])->on('product_variants')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropForeign('inventories_branch_id_fkey');
            $table->dropForeign('inventories_variant_id_fkey');
        });
    }
};
