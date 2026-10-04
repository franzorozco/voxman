<?php

namespace App\Models\Catalog;

use App\Models\Base\Attribute as BaseAttribute;

class Attribute extends BaseAttribute
{
	protected $fillable = [
		'name',
        'is_fixed'
	];

    protected $casts = [
        'is_fixed' => 'boolean',
    ];
}
