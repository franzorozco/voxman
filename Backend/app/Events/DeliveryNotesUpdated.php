<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeliveryNotesUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $scheduleId;
    public $notes;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct($scheduleId, $notes)
    {
        $this->scheduleId = $scheduleId;
        $this->notes = $notes;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new Channel('deliveries.' . $this->scheduleId);
    }

    public function broadcastAs()
    {
        return 'DeliveryNotesUpdated';
    }
}
