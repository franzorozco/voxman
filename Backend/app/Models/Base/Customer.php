<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Customer
 * 
 * @property uuid $id
 * @property uuid|null $user_id
 * @property string $customer_code
 * @property int|null $points
 * @property float|null $total_purchases
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property User|null $user
 * @property Collection|Sale[] $sales
 *
 * @package App\Models\Base
 */
class Customer extends Model
{
	use SoftDeletes;
	protected $table = 'customers';
	public $incrementing = false;
    protected $keyType = 'string';

	protected $casts = [
		'points' => 'int',
		'total_purchases' => 'float'
	];

	public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function sales()
	{
		return $this->hasMany(Sale::class);
	}
}
