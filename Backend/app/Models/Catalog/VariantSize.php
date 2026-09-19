<?php

namespace App\Models\Catalog;

use App\Models\Base\VariantSize as BaseVariantSize;

class VariantSize extends BaseVariantSize
{
    protected $fillable = [
        'variant_id',
        'size_id',
        'fit_id',
    ];
}
