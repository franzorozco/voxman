<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\VariantSize;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Fit
 * 
 * @property uuid $id
 * @property string $name
 * 
 * @property Collection|VariantSize[] $variant_sizes
 *
 * @package App\Models\Base
 */
class Fit extends Model
{
	protected $table = 'fits';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid'
	];

	public function variant_sizes()
	{
		return $this->hasMany(VariantSize::class);
	}
}
