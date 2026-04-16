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
            $table->foreign(['address_id'], 'shipments_address_id_fkey')->references(['id'])->on('addresses')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['sale_id'], 'shipments_sale_id_fkey')->references(['id'])->on('sales')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropForeign('shipments_address_id_fkey');
            $table->dropForeign('shipments_sale_id_fkey');
        });
    }
};
