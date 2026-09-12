<?php

namespace App\Models\Base;

use App\Models\Actors\Customer;
use App\Models\Sales\SaleDetail;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Giftcard extends Model
{
	use SoftDeletes;
	protected $table = 'giftcards';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
		'initial_balance' => 'float',
		'current_balance' => 'float',
		'is_active' => 'boolean',
		'is_digitalized' => 'boolean',
		'expires_at' => 'datetime'
	];

	public function customer()
	{
		return $this->belongsTo(Customer::class, 'customer_id');
	}

	public function purchaser()
	{
		return $this->belongsTo(Customer::class, 'purchaser_id');
	}

	public function sale_detail()
	{
		return $this->belongsTo(SaleDetail::class, 'sale_detail_id');
	}

	public function transactions()
	{
		return $this->hasMany(\App\Models\Finance\GiftcardTransaction::class, 'giftcard_id');
	}
}
