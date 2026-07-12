<?php

namespace App\Models\Auth;

use App\Models\Base\Permission as BasePermission;
use Illuminate\Database\Eloquent\SoftDeletes;


class Permission extends BasePermission
{
	use SoftDeletes;
	use \App\Traits\Auditable;
	protected $fillable = [
		'name',
		'guard_name'
	];
}
