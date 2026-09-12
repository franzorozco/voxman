<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasColumn('sales', 'total_discount')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropColumn('total_discount');
            });
        }
        if (Schema::hasColumn('sale_details', 'discount_amount')) {
            Schema::table('sale_details', function (Blueprint $table) {
                $table->dropColumn('discount_amount');
            });
        }
    }

    public function down()
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'total_discount')) {
                $table->decimal('total_discount', 10, 2)->default(0);
            }
        });
        Schema::table('sale_details', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_details', 'discount_amount')) {
                $table->decimal('discount_amount', 10, 2)->default(0);
            }
        });
    }
};
