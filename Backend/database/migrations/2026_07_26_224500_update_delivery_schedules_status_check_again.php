<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Drop the existing check constraint
        DB::statement('ALTER TABLE delivery_schedules DROP CONSTRAINT IF EXISTS delivery_schedules_status_check');
        
        // Add the new check constraint including the new statuses
        DB::statement("ALTER TABLE delivery_schedules ADD CONSTRAINT delivery_schedules_status_check CHECK (status IN ('pending', 'assigned', 'on_the_way', 'at_the_meeting_point', 'completed', 'cancelled', 'prepared', 'packaged', 'shipped'))");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Drop the new constraint
        DB::statement('ALTER TABLE delivery_schedules DROP CONSTRAINT IF EXISTS delivery_schedules_status_check');
        
        // Revert to old check constraint
        DB::statement("ALTER TABLE delivery_schedules ADD CONSTRAINT delivery_schedules_status_check CHECK (status IN ('pending', 'assigned', 'on_the_way', 'at_the_meeting_point', 'completed', 'cancelled'))");
    }
};
