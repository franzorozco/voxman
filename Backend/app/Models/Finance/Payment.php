<?php

namespace App\Models\Finance;

use App\Models\Base\Payment as BasePayment;

class Payment extends BasePayment
{
	protected $fillable = [
		'sale_id',
		'cash_register_id',
		'payment_method_id',
		'amount',
		'currency',
		'status',
		'transaction_reference'
	];

    protected static function booted()
    {
        static::creating(function ($payment) {
            if (empty($payment->transaction_reference)) {
                $payment->transaction_reference = 'PYM-' . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
            }
        });
    }
}
