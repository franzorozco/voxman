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
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->default('uuid_generate_v4()')->primary();
            $table->uuid('owner_id')->nullable()->index('idx_products_owner');
            $table->uuid('category_id')->nullable()->index('idx_products_category');
            $table->uuid('product_type_id')->nullable();
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->string('slug')->nullable()->unique('products_slug_key');
            $table->decimal('base_price', 10);
            $table->boolean('is_active')->nullable()->default(true);
            $table->integer('views')->nullable()->default(0);
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
        Schema::dropIfExists('products');
    }
};
