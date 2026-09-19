<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the old CHECK constraint
        DB::statement('ALTER TABLE delivery_schedules DROP CONSTRAINT IF EXISTS delivery_schedules_status_check');

        // Add the new CHECK constraint with all valid statuses
        DB::statement("ALTER TABLE delivery_schedules ADD CONSTRAINT delivery_schedules_status_check CHECK (status::text = ANY (ARRAY['pending','assigned','on_the_way','at_the_meeting_point','completed','cancelled','failed']::text[]))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE delivery_schedules DROP CONSTRAINT IF EXISTS delivery_schedules_status_check');
        DB::statement("ALTER TABLE delivery_schedules ADD CONSTRAINT delivery_schedules_status_check CHECK (status::text = ANY (ARRAY['pending','assigned','completed','failed']::text[]))");
    }
};
