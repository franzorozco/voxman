<?php

namespace App\Models\Catalog;

use App\Models\Base\BundleItem as BaseBundleItem;

class BundleItem extends BaseBundleItem
{
	protected $fillable = [
        'id',
		'bundle_id',
		'product_id',
		'variant_id',
		'quantity',
        'created_at'
	];
}
