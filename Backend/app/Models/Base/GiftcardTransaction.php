<?php

namespace App\Models\Base;

use App\Models\Sales\Sale;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GiftcardTransaction extends Model
{
	use SoftDeletes;
	protected $table = 'giftcard_transactions';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
		'amount' => 'float',
	];

	public function giftcard()
	{
		return $this->belongsTo(\App\Models\Finance\Giftcard::class, 'giftcard_id');
	}

	public function sale()
	{
		return $this->belongsTo(Sale::class, 'sale_id');
	}
}
