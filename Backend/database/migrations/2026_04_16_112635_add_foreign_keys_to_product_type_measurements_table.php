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
        Schema::table('product_type_measurements', function (Blueprint $table) {
            $table->foreign(['measurement_type_id'], 'product_type_measurements_measurement_type_id_fkey')->references(['id'])->on('measurement_types')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['product_type_id'], 'product_type_measurements_product_type_id_fkey')->references(['id'])->on('product_types')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_type_measurements', function (Blueprint $table) {
            $table->dropForeign('product_type_measurements_measurement_type_id_fkey');
            $table->dropForeign('product_type_measurements_product_type_id_fkey');
        });
    }
};
