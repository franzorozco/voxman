<?php

namespace App\Models\Catalog;

use App\Models\Base\Size as BaseSize;

class Size extends BaseSize
{
	protected $fillable = [
		'name',
		'description'
	];
}
