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
        Schema::table('shipments', function (Blueprint $table) {
            $table->string('recipient_name', 150)->nullable();
            $table->string('recipient_ci', 50)->nullable();
            $table->string('recipient_phone', 50)->nullable();
            $table->string('destination_city', 150)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropColumn(['recipient_name', 'recipient_ci', 'recipient_phone', 'destination_city']);
        });
    }
};
