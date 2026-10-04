<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Finance\CashRegister;
use App\Models\Finance\PaymentMethod;
use App\Models\Sales\Sale;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Payment
 * 
 * @property uuid $id
 * @property uuid|null $sale_id
 * @property uuid|null $cash_register_id
 * @property uuid|null $payment_method_id
 * @property float $amount
 * @property string|null $currency
 * @property USER-DEFINED|null $status
 * @property string|null $transaction_reference
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Sale|null $sale
 * @property CashRegister|null $cash_register
 * @property PaymentMethod|null $payment_method
 *
 * @package App\Models\Base
 */
class Payment extends Model
{
	use SoftDeletes;
	protected $table = 'payments';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
		'amount' => 'float',
		'status' => 'string'
	];

	public function sale()
	{
		return $this->belongsTo(Sale::class);
	}

	public function cash_register()
	{
		return $this->belongsTo(CashRegister::class);
	}

	public function payment_method()
	{
		return $this->belongsTo(PaymentMethod::class);
	}
}
