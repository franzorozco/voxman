<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Core\User;
use App\Models\Core\UserProfile;
use App\Models\Core\Address;
use App\Models\Core\Notification;
use App\Models\Catalog\Wishlist;
use App\Models\Catalog\ProductReview;
use App\Models\Sales\Cart;
use App\Models\Sales\CartItem;
use App\Models\Sales\Sale;
use App\Models\Promotions\Discount;
use App\Models\Payment\Giftcard;
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

	protected $casts = [
		'points' => 'int',
		'total_purchases' => 'float'
	];

	public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function profile()
	{
		return $this->hasOneThrough(UserProfile::class, User::class, 'id', 'user_id', 'user_id', 'id');
	}

	public function wishlist()
	{
		return $this->hasOne(Wishlist::class);
	}

	public function wishlists()
	{
		return $this->hasMany(Wishlist::class);
	}

	public function cart()
	{
		return $this->hasOne(Cart::class);
	}

	public function cartItems()
	{
		return $this->hasMany(CartItem::class);
	}

	public function addresses()
	{
		return $this->hasMany(Address::class);
	}

	public function notifications()
	{
		return $this->hasMany(Notification::class);
	}

	public function reviews()
	{
		return $this->hasMany(ProductReview::class);
	}

	public function sales()
	{
		return $this->hasMany(Sale::class);
	}

	public function discounts()
	{
		return $this->belongsToMany(Discount::class, 'discount_customers', 'customer_id', 'discount_id');
	}

	public function received_giftcards()
	{
		return $this->hasMany(Giftcard::class, 'customer_id');
	}

	public function purchased_giftcards()
	{
		return $this->hasMany(Giftcard::class, 'purchaser_id');
	}
}
