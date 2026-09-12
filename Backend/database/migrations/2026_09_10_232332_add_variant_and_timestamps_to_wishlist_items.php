<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            // variant_id: nullable FK to product_variants
            $table->uuid('variant_id')->nullable()->after('product_id');

            // timestamps — only created_at (no updated_at needed for items)
            $table->timestamp('created_at')->nullable()->useCurrent()->after('variant_id');
        });
    }

    public function down(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->dropColumn(['variant_id', 'created_at']);
        });
    }
};
