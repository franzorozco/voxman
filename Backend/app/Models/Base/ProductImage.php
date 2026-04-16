<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ProductImage
 * 
 * @property uuid $id
 * @property uuid|null $product_id
 * @property string $url
 * @property bool|null $is_main
 * @property Carbon|null $created_at
 * 
 * @property Product|null $product
 *
 * @package App\Models\Base
 */
class ProductImage extends Model
{
	protected $table = 'product_images';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid',
		'product_id' => 'uuid',
		'is_main' => 'bool'
	];

	public function product()
	{
		return $this->belongsTo(Product::class);
	}
}
