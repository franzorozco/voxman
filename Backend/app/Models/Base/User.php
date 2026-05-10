<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Address;
use App\Models\AuditLog;
use App\Models\Cart;
use App\Models\CashRegister;
use App\Models\Actors\Customer;
use App\Models\Inventory\InventoryMovement;
use App\Models\Actors\Owner;
use App\Models\Catalog\ProductPriceHistory;
use App\Models\Sales\Sale;
use App\Models\Core\UserProfile;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class User
 * 
 * @property uuid $id
 * @property string $email
 * @property string|null $username
 * @property string $password
 * @property Carbon|null $last_login
 * @property bool|null $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Collection|CashRegister[] $cash_registers
 * @property Collection|Cart[] $carts
 * @property Collection|ProductPriceHistory[] $product_price_histories
 * @property Collection|AuditLog[] $audit_logs
 * @property Collection|UserProfile[] $user_profiles
 * @property Collection|Owner[] $owners
 * @property Collection|Customer[] $customers
 * @property Collection|InventoryMovement[] $inventory_movements
 * @property Collection|Address[] $addresses
 * @property Collection|Sale[] $sales
 *
 * @package App\Models\Base
 */
class User extends Authenticatable
{
	use SoftDeletes;
	protected $table = 'users';
	public $incrementing = false;
	protected $keyType = 'string';
	protected $primaryKey = 'id';
	protected $casts = [
		'last_login' => 'datetime',
		'is_active' => 'bool'
	];

	public function cash_registers()
	{
		return $this->hasMany(CashRegister::class);
	}

	public function carts()
	{
		return $this->hasMany(Cart::class);
	}

	public function product_price_histories()
	{
		return $this->hasMany(ProductPriceHistory::class, 'changed_by');
	}

	public function audit_logs()
	{
		return $this->hasMany(AuditLog::class);
	}

	
	public function user_profiles()
	{
		return $this->hasMany(UserProfile::class);
	}

	public function owners()
	{
		return $this->hasMany(Owner::class);
	}

	public function customers()
	{
		return $this->hasMany(Customer::class);
	}

	public function inventory_movements()
	{
		return $this->hasMany(InventoryMovement::class);
	}

	public function addresses()
	{
		return $this->hasMany(Address::class);
	}

	public function sales()
	{
		return $this->hasMany(Sale::class);
	}
}
