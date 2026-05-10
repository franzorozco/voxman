<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Category;
use App\Models\Discount;
use Illuminate\Database\Eloquent\Model;

/**
 * Class DiscountCategory
 * 
 * @property uuid $discount_id
 * @property uuid $category_id
 * 
 * @property Discount $discount
 * @property Category $category
 *
 * @package App\Models\Base
 */
class DiscountCategory extends Model
{
	protected $table = 'discount_categories';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
	];

	public function discount()
	{
		return $this->belongsTo(Discount::class);
	}

	public function category()
	{
		return $this->belongsTo(Category::class);
	}
}
