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
        Schema::create('variant_measurements', function (Blueprint $table) {
            $table->uuid('id')->default('uuid_generate_v4()')->primary();
            $table->uuid('variant_id')->nullable();
            $table->uuid('size_id')->nullable();
            $table->uuid('measurement_type_id')->nullable();
            $table->decimal('value', 10)->nullable();
            $table->timestamp('created_at')->nullable()->useCurrent();

            $table->unique(['variant_id', 'size_id', 'measurement_type_id'], 'variant_measurements_variant_id_size_id_measurement_type_id_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variant_measurements');
    }
};
