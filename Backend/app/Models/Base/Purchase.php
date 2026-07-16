<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Branch\Branch;
use App\Models\Actors\Employee;
use App\Models\Purchase\PurchaseDetail;
use App\Models\Inventory\PurchaseReception;
use App\Models\Purchase\PurchasePriceHistory;
use App\Models\Purchase\Supplier;
use App\Models\Finance\SupplierPayment;
use App\Models\Finance\AccountsPayable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Purchase
 * 
 * @property string $id
 * @property string|null $supplier_id
 * @property string|null $branch_id
 * @property string|null $employee_id
 * @property string|null $status
 * @property float|null $subtotal
 * @property float|null $tax
 * @property float|null $total
 * @property string|null $invoice_number
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Supplier|null $supplier
 * @property Branch|null $branch
 * @property Employee|null $employee
 * @property Collection|PurchaseDetail[] $purchase_details
 * @property Collection|PurchaseReception[] $purchase_receptions
 *
 * @package App\Models\Base
 */
class Purchase extends Model
{
	use SoftDeletes;

	protected $table = 'purchases';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
		'subtotal' => 'float',
		'tax' => 'float',
		'total' => 'float',
	];

	public function supplier()
	{
		return $this->belongsTo(Supplier::class);
	}

	public function branch()
	{
		return $this->belongsTo(Branch::class);
	}

	public function employee()
	{
		return $this->belongsTo(Employee::class);
	}

	public function purchase_details()
	{
		return $this->hasMany(PurchaseDetail::class);
	}

	public function purchase_receptions()
	{
		return $this->hasMany(PurchaseReception::class);
	}

	public function supplier_payments()
	{
		return $this->hasMany(SupplierPayment::class);
	}

	public function accounts_payables()
	{
		return $this->hasMany(AccountsPayable::class);
	}

	public function purchase_price_histories()
	{
		return $this->hasMany(PurchasePriceHistory::class);
	}
}