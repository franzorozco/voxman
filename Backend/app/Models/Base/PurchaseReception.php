<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Employee;
use App\Models\Purchase;
use App\Models\PurchaseReceptionDetail;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class PurchaseReception
 * 
 * @property string $id
 * @property string|null $purchase_id
 * @property string|null $employee_id
 * @property string|null $status
 * @property string|null $notes
 * @property Carbon|null $created_at
 * 
 * @property Purchase|null $purchase
 * @property Employee|null $employee
 * @property Collection|PurchaseReceptionDetail[] $purchase_reception_details
 *
 * @package App\Models\Base
 */
class PurchaseReception extends Model
{
	protected $table = 'purchase_receptions';
	public $incrementing = false;
	public $timestamps = false;

	public function purchase()
	{
		return $this->belongsTo(Purchase::class);
	}

	public function employee()
	{
		return $this->belongsTo(Employee::class);
	}

	public function purchase_reception_details()
	{
		return $this->hasMany(PurchaseReceptionDetail::class, 'reception_id');
	}
}