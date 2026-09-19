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
        Schema::table('expenses', function (Blueprint $table) {
            $table->string('fund_source', 20)->nullable(); // 'cash' or 'bank'
        });

        Schema::table('owner_payments', function (Blueprint $table) {
            $table->string('fund_source', 20)->nullable(); // 'cash' or 'bank'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn('fund_source');
        });

        Schema::table('owner_payments', function (Blueprint $table) {
            $table->dropColumn('fund_source');
        });
    }
};
