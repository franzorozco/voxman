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
        // Convert the enum column to a standard varchar to allow any string (like 'delivery')
        DB::statement("ALTER TABLE sales ALTER COLUMN sale_type TYPE varchar(50) USING sale_type::text");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // To reverse, we would have to cast it back, but it's safer to leave as varchar
    }
};
