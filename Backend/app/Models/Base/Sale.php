<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\SaleDetail;
use App\Models\Shipment;
use App\Models\StockReservation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Sale
 * 
 * @property uuid $id
 * @property uuid|null $customer_id
 * @property uuid|null $branch_id
 * @property uuid|null $user_id
 * @property USER-DEFINED $sale_type
 * @property USER-DEFINED|null $status
 * @property string|null $source
 * @property float $subtotal
 * @property float|null $discount_total
 * @property float $total
 * @property string|null $invoice_number
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Customer|null $customer
 * @property Branch|null $branch
 * @property User|null $user
 * @property Collection|Shipment[] $shipments
 * @property Collection|SaleDetail[] $sale_details
 * @property Collection|Payment[] $payments
 * @property Collection|StockReservation[] $stock_reservations
 *
 * @package App\Models\Base
 */
class Sale extends Model
{
	use SoftDeletes;
	protected $table = 'sales';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
		'sale_type' => 'USER-DEFINED',
		'status' => 'USER-DEFINED',
		'subtotal' => 'float',
		'discount_total' => 'float',
		'total' => 'float'
	];

	public function customer()
	{
		return $this->belongsTo(Customer::class);
	}

	public function branch()
	{
		return $this->belongsTo(Branch::class);
	}

	public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function shipments()
	{
		return $this->hasMany(Shipment::class);
	}

	public function sale_details()
	{
		return $this->hasMany(SaleDetail::class);
	}

	public function payments()
	{
		return $this->hasMany(Payment::class);
	}

	public function stock_reservations()
	{
		return $this->hasMany(StockReservation::class);
	}
}
