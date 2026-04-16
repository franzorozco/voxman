<?php

namespace App\Models\Finance;

use App\Models\Base\OwnerPaymentDetail as BaseOwnerPaymentDetail;

class OwnerPaymentDetail extends BaseOwnerPaymentDetail
{
	protected $fillable = [
		'owner_payment_id',
		'sale_detail_id',
		'amount'
	];
}
