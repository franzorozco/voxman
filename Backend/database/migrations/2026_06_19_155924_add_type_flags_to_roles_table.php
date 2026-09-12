<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->boolean('is_employee')->default(false);
            $table->boolean('is_customer')->default(false);
        });

        // Add CHECK constraint using raw SQL since Laravel Schema Builder doesn't natively support CHECK constraints across multiple columns easily.
        DB::statement('ALTER TABLE roles ADD CONSTRAINT check_roles_types CHECK (NOT (is_employee = true AND is_customer = true))');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE roles DROP CONSTRAINT IF EXISTS check_roles_types');
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['is_employee', 'is_customer']);
        });
    }
};
