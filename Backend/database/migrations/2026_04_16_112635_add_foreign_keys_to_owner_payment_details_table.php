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
        Schema::table('owner_payment_details', function (Blueprint $table) {
            $table->foreign(['owner_payment_id'], 'owner_payment_details_owner_payment_id_fkey')->references(['id'])->on('owner_payments')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['sale_detail_id'], 'owner_payment_details_sale_detail_id_fkey')->references(['id'])->on('sale_details')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('owner_payment_details', function (Blueprint $table) {
            $table->dropForeign('owner_payment_details_owner_payment_id_fkey');
            $table->dropForeign('owner_payment_details_sale_detail_id_fkey');
        });
    }
};
