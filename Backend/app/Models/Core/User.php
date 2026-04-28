<?php

namespace App\Models\Core;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Models\Base\User as BaseUser;
use Illuminate\Support\Str;

class User extends BaseUser
{
	use HasApiTokens, HasRoles;
	protected $guard_name = 'web';
	protected $hidden = [
		'password'
	];

	protected $fillable = [
		'email',
		'username',
		'password',
		'last_login',
		'is_active'
	];



	protected static function boot()
	{
		parent::boot();

		static::creating(function ($model) {
			if (!$model->id) {
				$model->id = (string) Str::uuid();
			}
		});
	}

	public function profile()
	{
		return $this->hasOne(UserProfile::class);
	}
	public function owner()
	{
		return $this->hasOne(\App\Models\Actors\Owner::class, 'user_id');
	}

	public function customer()
	{
		return $this->hasOne(\App\Models\Actors\Customer::class, 'user_id');
	}
	
	public function employee()
	{
		return $this->hasOne(\App\Models\Actors\Employee::class, 'user_id');
	}
}
