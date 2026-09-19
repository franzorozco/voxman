<?php

namespace App\Models\Catalog;

use App\Models\Base\VariantMeasurement as BaseVariantMeasurement;
use Illuminate\Support\Str;

class VariantMeasurement extends BaseVariantMeasurement
{
	protected $fillable = [
        'id',
		'variant_id',
		'size_id',
		'measurement_type_id',
		'value'
	];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
