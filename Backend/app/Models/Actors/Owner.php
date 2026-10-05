<?php

namespace App\Models\Actors;

use App\Models\Base\Owner as BaseOwner;

class Owner extends BaseOwner
{
	protected $fillable = [
		'user_id',
		'notification_email',
		'is_active'
	];

	public function expense_splits()
	{
		return $this->hasMany(\App\Models\Finance\ExpenseSplit::class);
	}
}