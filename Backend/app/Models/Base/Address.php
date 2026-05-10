<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Branch;
use App\Models\Shipment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Address
 * 
 * @property uuid $id
 * @property uuid|null $user_id
 * @property uuid|null $branch_id
 * @property string|null $address_type
 * @property string|null $country
 * @property string|null $state
 * @property string|null $city
 * @property string|null $zone
 * @property string|null $street
 * @property string|null $reference
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property User|null $user
 * @property Branch|null $branch
 * @property Collection|Shipment[] $shipments
 *
 * @package App\Models\Base
 */
class Address extends Model
{
	use SoftDeletes;
	protected $table = 'addresses';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
	];

	public function customer()
	{
		return $this->belongsTo(Customer::class);
	}

	public function branch()
	{
		return $this->belongsTo(Branch::class);
	}

	public function shipments()
	{
		return $this->hasMany(Shipment::class);
	}
}
