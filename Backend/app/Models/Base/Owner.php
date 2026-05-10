<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\OwnerPayment;
use App\Models\Product;
use App\Models\SaleDetail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Owner
 * 
 * @property uuid $id
 * @property uuid|null $user_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property User|null $user
 * @property Collection|OwnerPayment[] $owner_payments
 * @property Collection|Product[] $products
 * @property Collection|SaleDetail[] $sale_details
 *
 * @package App\Models\Base
 */
class Owner extends Model
{
	use SoftDeletes;
	protected $table = 'owners';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
	];

	public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function owner_payments()
	{
		return $this->hasMany(OwnerPayment::class);
	}

	public function products()
	{
		return $this->hasMany(Product::class);
	}

	public function sale_details()
	{
		return $this->hasMany(SaleDetail::class);
	}
}
