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
        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->default('uuid_generate_v4()')->primary();
            $table->uuid('customer_id')->nullable()->index('idx_sales_customer');
            $table->uuid('branch_id')->nullable()->index('idx_sales_branch');
            $table->uuid('user_id')->nullable();
            $table->enum('source', ['web', 'mobile', 'store'])->nullable();
            $table->decimal('subtotal', 10)->default(0);
            $table->decimal('discount_total', 10)->nullable()->default(0);
            $table->decimal('total', 10)->default(0);
            $table->string('invoice_number', 50)->nullable()->unique('sales_invoice_number_key');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });
        DB::statement("alter table \"sales\" add column \"sale_type\" sale_type not null");
        DB::statement("alter table \"sales\" add column \"status\" sale_status null default 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
