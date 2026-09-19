<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->uuid('applied_discount_id')->nullable()->after('discount_amount');
            $table->string('discount_label', 191)->nullable()->after('applied_discount_id');
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropColumn(['applied_discount_id', 'discount_label']);
        });
    }
};
