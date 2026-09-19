<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Sales\Cart;
use App\Models\Inventory\StockReservation;

class CleanupExpiredCarts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'carts:cleanup-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpia carritos expirados y libera su stock reservado';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now();
        
        // Find all active carts that have expired
        $expiredCarts = Cart::where('status', 'active')
            ->where('expires_at', '<', $now)
            ->get();

        $count = 0;
        foreach ($expiredCarts as $cart) {
            // Change cart status
            $cart->status = 'abandoned';
            $cart->save();

            // Find reserved stock by cart_id
            $reservations = StockReservation::where('status', 'reserved')
                ->where('cart_id', $cart->id)
                ->get();
            
            foreach ($reservations as $reservation) {
                $reservation->status = 'released';
                $reservation->save();
            }

            $count++;
        }

        $this->info("Se han marcado como abandonados y liberado stock de {$count} carritos expirados.");
    }
}
