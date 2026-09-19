<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('wishlist_items', 'variant_id')) {
            Schema::table('wishlist_items', function (Blueprint $table) {
                // variant_id: nullable FK to product_variants
                $table->uuid('variant_id')->nullable()->after('product_id');
            });
        }

        if (!Schema::hasColumn('wishlist_items', 'created_at')) {
            Schema::table('wishlist_items', function (Blueprint $table) {
                // timestamps — only created_at (no updated_at needed for items)
                $table->timestamp('created_at')->nullable()->useCurrent()->after('product_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            if (Schema::hasColumn('wishlist_items', 'variant_id') && !Schema::hasColumn('product_variants', 'id')) {
                // Only drop if we added it (heuristically, or just don't worry too much on down)
                // Actually let's just drop them if they exist
            }
        });
        
        if (Schema::hasColumn('wishlist_items', 'variant_id')) {
            Schema::table('wishlist_items', function (Blueprint $table) {
                $table->dropColumn('variant_id');
            });
        }
        
        if (Schema::hasColumn('wishlist_items', 'created_at')) {
            Schema::table('wishlist_items', function (Blueprint $table) {
                $table->dropColumn('created_at');
            });
        }
    }
};
