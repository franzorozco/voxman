<?php

namespace App\Models\Catalog;

use App\Models\Base\VariantImage as BaseVariantImage;

class VariantImage extends BaseVariantImage
{
	protected $fillable = [
		'variant_id',
		'url'
	];
}
