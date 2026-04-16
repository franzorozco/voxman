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
        Schema::table('addresses', function (Blueprint $table) {
            $table->foreign(['branch_id'], 'addresses_branch_id_fkey')->references(['id'])->on('branches')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['user_id'], 'addresses_user_id_fkey')->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->dropForeign('addresses_branch_id_fkey');
            $table->dropForeign('addresses_user_id_fkey');
        });
    }
};
