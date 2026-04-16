<?php

namespace App\Models\Catalog;

use App\Models\Base\ProductPriceHistory as BaseProductPriceHistory;

class ProductPriceHistory extends BaseProductPriceHistory
{
	protected $fillable = [
		'variant_id',
		'old_price',
		'new_price',
		'changed_by'
	];
}
