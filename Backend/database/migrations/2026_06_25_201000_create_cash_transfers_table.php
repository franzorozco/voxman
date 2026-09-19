<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('cash_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('from_branch_id')->nullable();
            $table->uuid('to_branch_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('status')->default('completed'); // pending, completed
            $table->timestamp('transfer_date');
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('from_branch_id')->references('id')->on('branches')->onDelete('set null');
            $table->foreign('to_branch_id')->references('id')->on('branches')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('cash_transfers');
    }
};
