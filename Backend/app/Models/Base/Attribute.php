<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Catalog\AttributeValue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Attribute
 * 
 * @property uuid $id
 * @property string $name
 * 
 * @property Collection|AttributeValue[] $attribute_values
 *
 * @package App\Models\Base
 */
class Attribute extends Model
{
	protected $table = 'attributes';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
	];

	public function attribute_values()
	{
		return $this->hasMany(AttributeValue::class);
	}


}
