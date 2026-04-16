<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->default('uuid_generate_v4()')->primary();
            $table->uuid('sale_id')->nullable();
            $table->uuid('cash_register_id')->nullable();
            $table->uuid('payment_method_id')->nullable()->index('idx_payments_method');
            $table->decimal('amount', 10);
            $table->string('currency', 10)->nullable()->default('BOB');
            $table->string('transaction_reference', 150)->nullable();
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });
        DB::statement("alter table \"payments\" add column \"status\" payment_status null default 'completed'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
