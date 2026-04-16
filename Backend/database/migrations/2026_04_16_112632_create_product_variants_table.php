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
        Schema::create('product_variants', function (Blueprint $table) {
            $table->uuid('id')->default('uuid_generate_v4()')->primary();
            $table->uuid('product_id')->nullable()->index('idx_variants_product');
            $table->string('sku', 100)->index('idx_variant_sku');
            $table->string('barcode', 100)->nullable();
            $table->decimal('weight', 10)->nullable();
            $table->decimal('price', 10)->nullable();
            $table->decimal('cost', 10)->nullable();
            $table->boolean('is_active')->nullable()->default(true);
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();

            $table->unique(['sku'], 'product_variants_sku_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
