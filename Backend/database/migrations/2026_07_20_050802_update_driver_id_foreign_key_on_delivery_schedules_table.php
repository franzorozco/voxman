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
        Schema::table('delivery_schedules', function (Blueprint $table) {
            $table->dropForeign('delivery_schedules_driver_id_fkey');
            $table->foreign('driver_id')->references('id')->on('employees')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('delivery_schedules', function (Blueprint $table) {
            $table->dropForeign(['driver_id']);
            $table->foreign('driver_id', 'delivery_schedules_driver_id_fkey')->references('id')->on('delivery_drivers')->onDelete('set null');
        });
    }
};
