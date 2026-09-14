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
        if (!Schema::hasColumn('wishlist_items', 'variant_id')) {
            Schema::table('wishlist_items', function (Blueprint $table) {
                $table->uuid('variant_id')->nullable()->after('product_id');
            });
        }

        Schema::table('wishlist_items', function (Blueprint $table) {
            // Add foreign key separately in case the column already existed
            $table->foreign('variant_id')->references('id')->on('product_variants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->dropForeign(['variant_id']);
            $table->dropColumn('variant_id');
        });
    }
};
