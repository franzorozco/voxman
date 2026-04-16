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
        Schema::table('sales', function (Blueprint $table) {
            $table->foreign(['branch_id'], 'sales_branch_id_fkey')->references(['id'])->on('branches')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['customer_id'], 'sales_customer_id_fkey')->references(['id'])->on('customers')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['user_id'], 'sales_user_id_fkey')->references(['id'])->on('users')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign('sales_branch_id_fkey');
            $table->dropForeign('sales_customer_id_fkey');
            $table->dropForeign('sales_user_id_fkey');
        });
    }
};
