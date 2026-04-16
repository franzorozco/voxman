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
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->foreign(['branch_id'], 'cash_registers_branch_id_fkey')->references(['id'])->on('branches')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['user_id'], 'cash_registers_user_id_fkey')->references(['id'])->on('users')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->dropForeign('cash_registers_branch_id_fkey');
            $table->dropForeign('cash_registers_user_id_fkey');
        });
    }
};
