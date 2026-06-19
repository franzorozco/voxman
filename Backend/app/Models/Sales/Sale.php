<?php

namespace App\Models\Sales;

use App\Models\Base\Sale as BaseSale;

class Sale extends BaseSale
{
	protected $fillable = [
		'customer_id',
		'branch_id',
		'user_id',
		'sale_type',
		'status',
		'source',
		'subtotal',
		'discount_total',
		'total',
		'invoice_number',
		'notes'
	];

	public function giftcard_transactions()
	{
		return $this->hasMany(\App\Models\Base\GiftcardTransaction::class, 'sale_id');
	}
}
