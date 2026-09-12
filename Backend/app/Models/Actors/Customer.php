<?php

namespace App\Models\Actors;

use App\Models\Base\Customer as BaseCustomer;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Customer extends BaseCustomer
{
	use HasUuids;
	
	protected $fillable = [
		'user_id',
		'is_active',
		'customer_code',
		'points',
		'total_purchases',
		'tags'
	];

	protected $casts = [
		'tags' => 'array',
	];

	public function posProfile()
	{
		return $this->hasOne(PosCustomerProfile::class, 'customer_id');
	}

	public function timelines()
	{
		return $this->hasMany(CustomerTimeline::class, 'customer_id')->orderBy('created_at', 'desc');
	}
}