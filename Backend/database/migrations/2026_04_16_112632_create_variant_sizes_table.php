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
        Schema::create('variant_sizes', function (Blueprint $table) {
            $table->uuid('variant_id');
            $table->uuid('size_id');
            $table->uuid('fit_id');

            $table->primary(['variant_id', 'size_id', 'fit_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variant_sizes');
    }
};
