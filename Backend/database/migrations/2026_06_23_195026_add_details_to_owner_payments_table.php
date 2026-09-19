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
        Schema::table('owner_payments', function (Blueprint $table) {
            $table->text('notes')->nullable();
            $table->string('reference_number')->nullable();
            $table->string('payment_method')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('owner_payments', function (Blueprint $table) {
            $table->dropColumn(['notes', 'reference_number', 'payment_method']);
        });
    }
};
