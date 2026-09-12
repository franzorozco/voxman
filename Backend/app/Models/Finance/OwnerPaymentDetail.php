<?php

namespace App\Models\Finance;

use App\Models\Base\OwnerPaymentDetail as BaseOwnerPaymentDetail;
use Illuminate\Support\Str;

class OwnerPaymentDetail extends BaseOwnerPaymentDetail
{
	protected $fillable = [
		'owner_payment_id',
		'sale_detail_id',
		'amount'
	];

	protected static function boot()
	{
		parent::boot();
		static::creating(function ($model) {
			if (empty($model->id)) {
				$model->id = (string) Str::uuid();
			}
		});
	}
}
