<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\VariantMeasurement;
use App\Models\VariantSize;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Size
 * 
 * @property uuid $id
 * @property string $name
 * @property string|null $description
 * @property Carbon|null $created_at
 * @property string|null $deleted_at
 * 
 * @property Collection|VariantSize[] $variant_sizes
 * @property Collection|VariantMeasurement[] $variant_measurements
 *
 * @package App\Models\Base
 */
class Size extends Model
{
	use SoftDeletes;
	protected $table = 'sizes';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid'
	];

	public function variant_sizes()
	{
		return $this->hasMany(VariantSize::class);
	}

	public function variant_measurements()
	{
		return $this->hasMany(VariantMeasurement::class);
	}
}
