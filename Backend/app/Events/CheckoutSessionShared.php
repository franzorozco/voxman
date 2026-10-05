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

    public $isAdvancePayment;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct($scheduleId, $data)
    {
        $this->scheduleId = $scheduleId;
        $this->paymentMethod = $data ? $data['payment_method'] : null;
        $this->montoReal = $data ? $data['monto_real'] : null;
        $this->cashAmount = $data ? ($data['cash_amount'] ?? null) : null;
        $this->qrAmount = $data ? ($data['qr_amount'] ?? null) : null;
        $this->saleTotal = $data ? ($data['sale_total'] ?? null) : null;
        $this->isAdvancePayment = $data ? ($data['is_advance_payment'] ?? false) : false;
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
