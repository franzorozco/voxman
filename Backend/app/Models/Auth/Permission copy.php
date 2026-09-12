<?php

namespace App\Models\Auth;

use App\Models\Base\Permission as BasePermission;

class Permission extends BasePermission
{
	use \App\Traits\Auditable;

	protected $fillable = [
		'name',
		'guard_name'
	];
}
