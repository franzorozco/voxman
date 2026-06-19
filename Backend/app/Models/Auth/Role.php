<?php

namespace App\Models\Auth;



use Spatie\Permission\Models\Role as SpatieRole;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends SpatieRole
{
	use SoftDeletes;

	protected $fillable = [
		'name',
		'guard_name',
		'is_employee',
		'is_customer'
	];

	protected $casts = [
		'is_employee' => 'boolean',
		'is_customer' => 'boolean'
	];
}
