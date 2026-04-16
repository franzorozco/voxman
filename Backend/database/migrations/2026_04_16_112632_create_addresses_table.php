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
        Schema::create('addresses', function (Blueprint $table) {
            $table->uuid('id')->default('uuid_generate_v4()')->primary();
            $table->uuid('user_id')->nullable()->index('idx_addresses_user');
            $table->uuid('branch_id')->nullable();
            $table->enum('address_type', ['shipping', 'billing', 'branch'])->nullable();
            $table->string('country', 100)->nullable()->default('Bolivia');
            $table->string('state', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('zone', 150)->nullable();
            $table->string('street', 150)->nullable();
            $table->text('reference')->nullable();
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
