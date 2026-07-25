<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CheckoutSessionShared implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $scheduleId;
    public $paymentMethod;
    public $montoReal;
    public $cashAmount;
    public $qrAmount;
    public $saleTotal;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct($scheduleId, $data)
    {
        $this->scheduleId = $scheduleId;
        $this->paymentMethod = $data['payment_method'];
        $this->montoReal = $data['monto_real'];
        $this->cashAmount = $data['cash_amount'] ?? null;
        $this->qrAmount = $data['qr_amount'] ?? null;
        $this->saleTotal = $data['sale_total'] ?? null;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return [
            new Channel('deliveries.' . $this->scheduleId)
        ];
    }
    
    public function broadcastAs()
    {
        return 'checkout.session.shared';
    }
}
