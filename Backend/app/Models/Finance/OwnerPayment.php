<?php

namespace App\Models\Finance;

use App\Models\Base\OwnerPayment as BaseOwnerPayment;
use Illuminate\Support\Str;

class OwnerPayment extends BaseOwnerPayment
{
	protected $fillable = [
		'owner_id',
		'branch_id',
		'total_amount',
		'status',
		'payment_date',
		'type',
		'fund_source',
        'notes',
        'reference_number',
        'payment_method'
	];

	protected $casts = [
        'payment_date' => 'datetime',
        'total_amount' => 'decimal:2',
    ];

	protected static function boot()
	{
		parent::boot();
		static::creating(function ($model) {
			if (empty($model->id)) {
				$model->id = (string) Str::uuid();
			}
		});
	}

    public function owner()
    {
        return $this->belongsTo(\App\Models\Actors\Owner::class);
    }

    public function branch()
    {
        return $this->belongsTo(\App\Models\Branch\Branch::class, 'branch_id');
    }
}
