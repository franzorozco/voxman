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
        Schema::table('variant_images', function (Blueprint $table) {
            $table->foreign(['variant_id'], 'variant_images_variant_id_fkey')->references(['id'])->on('product_variants')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('variant_images', function (Blueprint $table) {
            $table->dropForeign('variant_images_variant_id_fkey');
        });
    }
};
