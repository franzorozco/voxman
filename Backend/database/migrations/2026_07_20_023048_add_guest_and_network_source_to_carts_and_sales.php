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
        Schema::table('carts', function (Blueprint $table) {
            $table->uuid('guest_id')->nullable();
            
            $table->foreign('guest_id')->references('id')->on('guests')->onDelete('set null');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->uuid('guest_id')->nullable();

            $table->foreign('guest_id')->references('id')->on('guests')->onDelete('set null');
        });

        // Drop and recreate sales_source_check in Postgres
        DB::statement('ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_source_check');
        DB::statement("ALTER TABLE sales ADD CONSTRAINT sales_source_check CHECK (source IN ('web', 'mobile', 'store', 'order_network'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropForeign(['guest_id']);
            $table->dropColumn('guest_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['guest_id']);
            $table->dropColumn('guest_id');
        });

        DB::statement('ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_source_check');
        DB::statement("ALTER TABLE sales ADD CONSTRAINT sales_source_check CHECK (source IN ('web', 'mobile', 'store'))");
    }
};
