<?php

namespace App\Models\Auth;

use App\Models\Base\Role as BaseRole;

class Role extends BaseRole
{
	protected $fillable = [
		'name',
		'guard_name'
	];
}
