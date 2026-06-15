<?php

namespace App\Models\Finance;

use App\Models\Base\Giftcard as BaseGiftcard;

class Giftcard extends BaseGiftcard
{
	protected $fillable = [
		'id',
		'code',
		'initial_balance',
		'current_balance',
		'customer_id',
		'purchaser_id',
		'sale_detail_id',
		'expires_at',
		'is_active',
		'is_digitalized'
	];
}
