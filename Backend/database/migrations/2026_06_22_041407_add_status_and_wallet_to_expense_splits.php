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
        Schema::table('expense_splits', function (Blueprint $table) {
            $table->string('status', 20)->default('pending'); // pending, paid
            $table->boolean('deducted_from_wallet')->default(false);
            $table->timestamp('paid_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expense_splits', function (Blueprint $table) {
            $table->dropColumn(['status', 'deducted_from_wallet', 'paid_at']);
        });
    }
};
