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
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->foreign(['branch_id'], 'inventory_movements_branch_id_fkey')->references(['id'])->on('branches')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['user_id'], 'inventory_movements_user_id_fkey')->references(['id'])->on('users')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['variant_id'], 'inventory_movements_variant_id_fkey')->references(['id'])->on('product_variants')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->dropForeign('inventory_movements_branch_id_fkey');
            $table->dropForeign('inventory_movements_user_id_fkey');
            $table->dropForeign('inventory_movements_variant_id_fkey');
        });
    }
};
