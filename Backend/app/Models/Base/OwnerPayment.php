<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Owner;
use App\Models\OwnerPaymentDetail;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class OwnerPayment
 * 
 * @property uuid $id
 * @property uuid|null $owner_id
 * @property float $total_amount
 * @property string|null $status
 * @property Carbon|null $payment_date
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * @property string|null $type
 * 
 * @property Owner|null $owner
 * @property Collection|OwnerPaymentDetail[] $owner_payment_details
 *
 * @package App\Models\Base
 */
class OwnerPayment extends Model
{
	use SoftDeletes;
	protected $table = 'owner_payments';
	public $incrementing = false;

	protected $casts = [
		'id' => 'uuid',
		'owner_id' => 'uuid',
		'total_amount' => 'float',
		'payment_date' => 'datetime'
	];

	public function owner()
	{
		return $this->belongsTo(Owner::class);
	}

	public function owner_payment_details()
	{
		return $this->hasMany(OwnerPaymentDetail::class);
	}
}
