<?php

namespace App\Models\Auth;

use App\Models\Base\Permission as BasePermission;

class Permission extends BasePermission
{
	protected $fillable = [
		'name',
		'guard_name'
	];
}
