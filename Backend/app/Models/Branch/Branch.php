<?php

namespace App\Models\Branch;

use App\Models\Base\Branch as BaseBranch;

class Branch extends BaseBranch
{
	protected $fillable = [
		'name',
		'phone',
		'is_active'
	];

	protected $casts = [
		'is_active' => 'boolean',
	];

	public function address()
	{
		return $this->hasOne(\App\Models\Core\Address::class, 'branch_id')->where('address_type', 'branch');
	}

	public function manager()
	{
		return $this->hasOne(\App\Models\Actors\Employee::class, 'branch_id')->where('role', 'manager');
	}

	public function images()
	{
		return $this->hasMany(BranchImage::class, 'branch_id')->orderBy('display_order');
	}
}
