<?php

namespace App\Models\Core;

use App\Models\Base\UserProfile as BaseUserProfile;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;

class UserProfile extends BaseUserProfile
{
	use HasUuids;

	protected $fillable = [
		'user_id',
		'first_name',
		'last_name_paternal',
		'last_name_maternal',
		'phone',
		'birthdate',
		'gender'
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

	public function user()
	{
		return $this->belongsTo(User::class);
	}
}

