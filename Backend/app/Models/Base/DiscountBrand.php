<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Discount\Discount;
use App\Models\Catalog\Brand;
use Illuminate\Database\Eloquent\Model;

/**
 * Class DiscountBrand
 * 
 * @property string $discount_id
 * @property int $brand_id
 * 
 * @property Discount $discount
 * @property Brand $brand
 *
 * @package App\Models\Base
 */
class DiscountBrand extends Model
{
	protected $table = 'discount_brands';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'brand_id' => 'int'
	];

	public function discount()
	{
		return $this->belongsTo(Discount::class);
	}

	public function brand()
	{
		return $this->belongsTo(Brand::class);
	}
}
