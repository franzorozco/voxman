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
        Schema::create('cart_items', function (Blueprint $table) {
            $table->uuid('id')->default('uuid_generate_v4()')->primary();
            $table->uuid('cart_id')->nullable();
            $table->uuid('variant_id')->nullable();
            $table->integer('quantity');
            $table->timestamp('created_at')->nullable()->useCurrent();

            $table->unique(['cart_id', 'variant_id'], 'cart_items_cart_id_variant_id_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
