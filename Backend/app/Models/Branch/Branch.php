<?php

namespace App\Models\Branch;

use App\Models\Base\Branch as BaseBranch;

class Branch extends BaseBranch
{
	protected $fillable = [
		'name',
		'phone'
	];
}
