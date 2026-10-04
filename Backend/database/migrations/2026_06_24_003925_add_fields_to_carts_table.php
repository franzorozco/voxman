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
        Schema::table('carts', function (Blueprint $table) {
            $table->string('reference_number')->nullable()->unique();
            $table->string('status')->default('active'); // active, abandoned, proforma, converted
            $table->string('source')->default('store'); // store, web, mobile
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn([
                'reference_number',
                'status',
                'source',
                'expires_at',
                'updated_at'
            ]);
        });
    }
};
