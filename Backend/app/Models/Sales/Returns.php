<?php

namespace App\Models\Sales;

use App\Models\Base\Returns as BaseReturn;
 
class Returns extends BaseReturn
{
	protected $fillable = [
		'sale_detail_id',
		'quantity',
		'reason',
		'reference_number',
		'status',
		'refund_method',
		'refund_amount',
		'restock_destination',
		'updated_at'
	];
}
