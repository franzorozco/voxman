<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeliveryStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $scheduleId;
    public $status;
    public $deliveryCode;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct($scheduleId, $status, $deliveryCode = null)
    {
        $this->scheduleId = $scheduleId;
        $this->status = $status;
        $this->deliveryCode = $deliveryCode;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return [
            new Channel('deliveries.' . $this->scheduleId),
            new Channel('deliveries.global') // For dashboard
        ];
    }
    
    public function broadcastAs()
    {
        return 'delivery.status.updated';
    }
}
