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
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->uuid('id')->default('uuid_generate_v4()')->primary();
            $table->uuid('user_id')->nullable()->index('idx_profiles_user');
            $table->string('first_name', 100);
            $table->string('last_name_paternal', 100)->nullable();
            $table->string('last_name_maternal', 100)->nullable();
            $table->string('phone', 20)->nullable();
            $table->date('birthdate')->nullable();
            $table->string('gender', 20)->nullable();
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();

            $table->unique(['user_id'], 'user_profiles_user_id_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
