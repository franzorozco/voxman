<?php

namespace App\Models\Notification;

use App\Models\Base\Notification as BaseNotification;

class Notification extends BaseNotification
{
	protected $fillable = [
		'customer_id',
		'title',
		'message',
		'type',
		'is_read',
	];
}