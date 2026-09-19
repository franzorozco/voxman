<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeliveryDiscountRemoved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $scheduleId;
    public $sale;

    public function __construct($scheduleId, $sale)
    {
        $this->scheduleId = $scheduleId;
        $this->sale = $sale;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('deliveries.' . $this->scheduleId),
        ];
    }

    public function broadcastAs()
    {
        return 'delivery.discount.removed';
    }
}
