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

	public function sale_applied_discounts()
	{
		return $this->hasMany(\App\Models\Sales\SaleAppliedDiscount::class, 'sale_id');
	}
}
