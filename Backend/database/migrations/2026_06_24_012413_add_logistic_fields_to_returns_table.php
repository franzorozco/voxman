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
        Schema::table('returns', function (Blueprint $table) {
            $table->string('reference_number')->nullable()->unique();
            $table->string('status')->default('pending'); // pending, inspection, approved, rejected
            $table->string('refund_method')->nullable(); // cash, credit, transfer
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->string('restock_destination')->nullable(); // inventory, quarantine
            $table->timestamp('updated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->dropColumn([
                'reference_number',
                'status',
                'refund_method',
                'refund_amount',
                'restock_destination',
                'updated_at'
            ]);
        });
    }
};
