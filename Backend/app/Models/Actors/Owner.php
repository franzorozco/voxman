<?php

namespace App\Models\Actors;

use App\Models\Base\Owner as BaseOwner;

class Owner extends BaseOwner
{
	protected $fillable = [
		'user_id',
		'is_active'
	];
}