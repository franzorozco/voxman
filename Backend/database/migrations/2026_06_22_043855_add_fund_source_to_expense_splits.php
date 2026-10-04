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
            $table->string('fund_source')->nullable(); // cash, bank
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expense_splits', function (Blueprint $table) {
            $table->dropColumn('fund_source');
        });
    }
};
