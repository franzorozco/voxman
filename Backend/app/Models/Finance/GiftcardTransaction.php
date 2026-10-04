<?php

namespace App\Models\Finance;

use App\Models\Base\GiftcardTransaction as BaseGiftcardTransaction;

class GiftcardTransaction extends BaseGiftcardTransaction
{
	protected $fillable = [
		'id',
		'giftcard_id',
		'type',
		'amount',
		'sale_id',
		'notes'
	];
}
