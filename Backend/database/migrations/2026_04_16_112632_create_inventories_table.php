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
        Schema::create('inventories', function (Blueprint $table) {
            $table->uuid('id')->default('uuid_generate_v4()')->primary();
            $table->uuid('branch_id')->nullable()->index('idx_inventories_branch');
            $table->uuid('variant_id')->nullable()->index('idx_inventory_variant');
            $table->integer('stock')->nullable()->default(0);
            $table->integer('min_stock')->nullable()->default(0);
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();

            $table->index(['branch_id', 'variant_id'], 'idx_inventory_branch_variant');
            $table->unique(['branch_id', 'variant_id'], 'inventories_branch_id_variant_id_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
