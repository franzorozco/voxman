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
        Schema::table('variant_sizes', function (Blueprint $table) {
            $table->foreign(['fit_id'], 'variant_sizes_fit_id_fkey')->references(['id'])->on('fits')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['size_id'], 'variant_sizes_size_id_fkey')->references(['id'])->on('sizes')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['variant_id'], 'variant_sizes_variant_id_fkey')->references(['id'])->on('product_variants')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('variant_sizes', function (Blueprint $table) {
            $table->dropForeign('variant_sizes_fit_id_fkey');
            $table->dropForeign('variant_sizes_size_id_fkey');
            $table->dropForeign('variant_sizes_variant_id_fkey');
        });
    }
};
