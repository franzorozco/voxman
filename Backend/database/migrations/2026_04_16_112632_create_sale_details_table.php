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
        Schema::create('sale_details', function (Blueprint $table) {
            $table->uuid('id')->default('uuid_generate_v4()')->primary();
            $table->uuid('sale_id')->nullable();
            $table->uuid('variant_id')->nullable();
            $table->uuid('owner_id')->nullable()->index('idx_sale_details_owner');
            $table->integer('quantity');
            $table->decimal('unit_price', 10);
            $table->decimal('discount', 10)->nullable()->default(0);
            $table->decimal('final_price', 10);
            $table->decimal('subtotal', 10);
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_details');
    }
};
