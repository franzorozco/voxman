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
        Schema::table('delivery_zones', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable()->after('extra_cost_per_km');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
        });

        Schema::table('delivery_schedules', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable()->after('meeting_point');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('delivery_zones', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });

        Schema::table('delivery_schedules', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
