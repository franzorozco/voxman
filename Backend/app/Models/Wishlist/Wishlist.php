<?php

namespace App\Models\Wishlist;

use App\Models\Base\Wishlist as BaseWishlist;

class Wishlist extends BaseWishlist
{
	protected $fillable = [
		'customer_id',
	];

	protected static function boot()
	{
		parent::boot();

		static::creating(function ($model) {
			if (empty($model->id)) {
				$model->id = (string) \Illuminate\Support\Str::uuid();
			}
			if (empty($model->created_at)) {
			    $model->created_at = now();
			}
		});
	}
}