<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Attribute;
use App\Models\VariantAttributeValue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class AttributeValue
 * 
 * @property uuid $id
 * @property uuid|null $attribute_id
 * @property string $value
 * 
 * @property Attribute|null $attribute
 * @property Collection|VariantAttributeValue[] $variant_attribute_values
 *
 * @package App\Models\Base
 */
class AttributeValue extends Model
{
	protected $table = 'attribute_values';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid',
		'attribute_id' => 'uuid'
	];

	public function attribute()
	{
		return $this->belongsTo(Attribute::class);
	}

	public function variant_attribute_values()
	{
		return $this->hasMany(VariantAttributeValue::class);
	}
}
