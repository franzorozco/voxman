<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('giftcards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->decimal('initial_balance', 10, 2);
            $table->decimal('current_balance', 10, 2);
            $table->uuid('customer_id')->nullable();
            $table->uuid('purchaser_id')->nullable();
            $table->uuid('sale_detail_id')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_digitalized')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->foreign('purchaser_id')->references('id')->on('customers')->onDelete('set null');
            $table->foreign('sale_detail_id')->references('id')->on('sale_details')->onDelete('set null');
        });

        Schema::create('giftcard_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('giftcard_id');
            $table->string('type', 20); // issue, redemption, refund, reload
            $table->decimal('amount', 10, 2);
            $table->uuid('sale_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('giftcard_id')->references('id')->on('giftcards')->onDelete('cascade');
            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('giftcard_transactions');
        Schema::dropIfExists('giftcards');
    }
};
