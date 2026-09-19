<?php

namespace App\Models\Core;

use App\Models\Base\UserProfile as BaseUserProfile;

class UserProfile extends BaseUserProfile
{
	protected $fillable = [
		'user_id',
		'first_name',
		'last_name_paternal',
		'last_name_maternal',
		'phone',
		'birthdate',
		'gender'
	];

	public function user()
    {
        return $this->belongsTo(User::class);
    }

}
