<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_details', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_details', 'original_price')) {
                $table->decimal('original_price', 10, 2)->nullable()->after('discount_amount');
            }
            if (!Schema::hasColumn('sale_details', 'bundle_group_id')) {
                $table->uuid('bundle_group_id')->nullable()->after('original_price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sale_details', function (Blueprint $table) {
            $table->dropColumn(array_filter([
                Schema::hasColumn('sale_details', 'original_price') ? 'original_price' : null,
                Schema::hasColumn('sale_details', 'bundle_group_id') ? 'bundle_group_id' : null,
            ]));
        });
    }
};
