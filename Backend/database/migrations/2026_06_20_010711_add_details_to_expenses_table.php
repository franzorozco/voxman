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
        Schema::table('expenses', function (Blueprint $table) {
            if (!Schema::hasColumn('expenses', 'description')) {
                $table->text('description')->nullable();
            }
            if (!Schema::hasColumn('expenses', 'category')) {
                $table->string('category', 50)->nullable()->default('General');
            }
            if (!Schema::hasColumn('expenses', 'status')) {
                $table->string('status', 20)->nullable()->default('paid');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn(['description', 'category', 'status']);
        });
    }
};
