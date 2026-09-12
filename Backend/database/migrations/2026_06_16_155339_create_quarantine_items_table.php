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
        Schema::create('quarantine_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('purchase_reception_id')->index();
            $table->uuid('variant_id')->index();
            $table->uuid('branch_id')->index();
            $table->enum('reason', ['damaged', 'wrong', 'other'])->default('damaged');
            $table->integer('quantity');
            $table->integer('resolved_quantity')->default(0);
            $table->enum('status', ['pending', 'partially_resolved', 'resolved'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('purchase_reception_id')->references('id')->on('purchase_receptions')->onDelete('cascade');
            $table->foreign('variant_id')->references('id')->on('product_variants')->onDelete('cascade');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quarantine_items');
    }
};
