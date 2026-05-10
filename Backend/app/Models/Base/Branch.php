<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Address;
use App\Models\CashRegister;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\Sale;
use App\Models\StockReservation;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Branch
 * 
 * @property uuid $id
 * @property string $name
 * @property string|null $phone
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Collection|CashRegister[] $cash_registers
 * @property Collection|Inventory[] $inventories
 * @property Collection|InventoryMovement[] $inventory_movements
 * @property Collection|Address[] $addresses
 * @property Collection|Sale[] $sales
 * @property Collection|StockReservation[] $stock_reservations
 *
 * @package App\Models\Base
 */
class Branch extends Model
{
	use SoftDeletes;
	protected $table = 'branches';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
	];

	public function cash_registers()
	{
		return $this->hasMany(CashRegister::class);
	}

	public function inventories()
	{
		return $this->hasMany(Inventory::class);
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

	public function stock_reservations()
	{
		return $this->hasMany(StockReservation::class);
	}
}
