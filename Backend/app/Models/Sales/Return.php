<?php

namespace App\Models\Sales;

use App\Models\Base\Return as BaseReturn;
 
class Returns extends BaseReturn
{
	protected $fillable = [
		'sale_detail_id',
		'quantity',
		'reason'
	];
}
