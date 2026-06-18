<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Customer;
use App\Models\WishlistItem;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Wishlist
 * 
 * @property string $id
 * @property string|null $customer_id
 * @property Carbon|null $created_at
 * 
 * @property Customer|null $customer
 * @property Collection|WishlistItem[] $wishlist_items
 *
 * @package App\Models\Base
 */
class Wishlist extends Model
{
	protected $table = 'wishlists';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'created_at' => 'datetime'
	];

	public function customer()
	{
		return $this->belongsTo(Customer::class);
	}

	public function items()
	{
		return $this->hasMany(WishlistItem::class);
	}
}