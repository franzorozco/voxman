<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Catalog\Attribute;
use App\Models\Catalog\VariantAttributeValue;
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
    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';

    public function attribute()
    {
        return $this->belongsTo(Attribute::class, 'attribute_id');
    }


	

	public function variant_attribute_values()
	{
		return $this->hasMany(VariantAttributeValue::class, 'attribute_value_id');
	}
}
