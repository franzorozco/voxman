<?php

namespace App\Console\Commands;

use App\Models\Core\User;
use Illuminate\Console\Command;

class CleanupUnverifiedUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:cleanup-unverified {--hours=24 : Horas de antigüedad máxima sin verificar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Elimina físicamente las cuentas web registradas que no verificaron su correo electrónico en el plazo establecido y no tienen compras.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $deletedCount = User::purgeExpiredUnverifiedUsers($hours);

        $this->info("Se eliminaron físicamente {$deletedCount} cuenta(s) sin verificar con más de {$hours}h de antigüedad.");

        return Command::SUCCESS;
    }
}
