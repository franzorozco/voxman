<?php

namespace App\Models\Catalog;

use App\Models\Base\VariantAttributeValue as BaseVariantAttributeValue;

class VariantAttributeValue extends BaseVariantAttributeValue
{
    protected $fillable = [

        'variant_id',
        'attribute_value_id',

    ];

}