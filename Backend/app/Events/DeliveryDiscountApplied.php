<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeliveryDiscountApplied implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $scheduleId;
    public $sale;
    public $discountData;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct($scheduleId, $sale, $discountData)
    {
        $this->scheduleId = $scheduleId;
        $this->sale = $sale;
        $this->discountData = $discountData;
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
        return 'delivery.discount.applied';
    }
}
