<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\OwnerPayment;
use App\Models\SaleDetail;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class OwnerPaymentDetail
 * 
 * @property uuid $id
 * @property uuid|null $owner_payment_id
 * @property uuid|null $sale_detail_id
 * @property float $amount
 * @property Carbon|null $created_at
 * 
 * @property OwnerPayment|null $owner_payment
 * @property SaleDetail|null $sale_detail
 *
 * @package App\Models\Base
 */
class OwnerPaymentDetail extends Model
{
	protected $table = 'owner_payment_details';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid',
		'owner_payment_id' => 'uuid',
		'sale_detail_id' => 'uuid',
		'amount' => 'float'
	];

	public function owner_payment()
	{
		return $this->belongsTo(OwnerPayment::class);
	}

	public function sale_detail()
	{
		return $this->belongsTo(SaleDetail::class);
	}
}
