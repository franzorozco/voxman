<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Catalog\AttributeValue;
use App\Models\Catalog\ProductVariant;
use Illuminate\Database\Eloquent\Model;

/**
 * Class VariantAttributeValue
 * 
 * @property uuid $variant_id
 * @property uuid $attribute_value_id
 * 
 * @property ProductVariant $product_variant
 * @property AttributeValue $attribute_value
 *
 * @package App\Models\Base
 */
class VariantAttributeValue extends Model
{
	protected $table = 'variant_attribute_values';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
	];

	public function product_variant()
	{
		return $this->belongsTo(ProductVariant::class, 'variant_id');
	}
	
	public function attribute_value()
	{
		return $this->belongsTo(
			AttributeValue::class,
			'attribute_value_id'
		);
	}




}
