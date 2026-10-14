<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'email_verified_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('email_verified_at')->nullable()->after('is_active');
            });

            // Marcar las cuentas preexistentes como verificadas para no bloquear usuarios ni personal actual
            DB::table('users')
                ->whereNull('email_verified_at')
                ->update([
                    'email_verified_at' => DB::raw('COALESCE(created_at, NOW())'),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'email_verified_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('email_verified_at');
            });
        }
    }
};
