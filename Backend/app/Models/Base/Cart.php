<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\CartItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Cart
 * 
 * @property uuid $id
 * @property uuid|null $user_id
 * @property Carbon|null $created_at
 * 
 * @property User|null $user
 * @property Collection|CartItem[] $cart_items
 *
 * @package App\Models\Base
 */
class Cart extends Model
{
	protected $table = 'carts';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid',
		'user_id' => 'uuid'
	];

	public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function cart_items()
	{
		return $this->hasMany(CartItem::class);
	}
}
