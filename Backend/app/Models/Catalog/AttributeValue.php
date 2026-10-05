<?php

namespace App\Models\Catalog;

use App\Models\Base\AttributeValue as BaseAttributeValue;

class AttributeValue extends BaseAttributeValue
{
	protected $fillable = [
		'attribute_id',
		'value',
		'hex_code'
	];
}
