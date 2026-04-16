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
        Schema::table('payments', function (Blueprint $table) {
            $table->foreign(['cash_register_id'], 'payments_cash_register_id_fkey')->references(['id'])->on('cash_registers')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['payment_method_id'], 'payments_payment_method_id_fkey')->references(['id'])->on('payment_methods')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['sale_id'], 'payments_sale_id_fkey')->references(['id'])->on('sales')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign('payments_cash_register_id_fkey');
            $table->dropForeign('payments_payment_method_id_fkey');
            $table->dropForeign('payments_sale_id_fkey');
        });
    }
};
