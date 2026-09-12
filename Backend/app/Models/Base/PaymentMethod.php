<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Payment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class PaymentMethod
 * 
 * @property uuid $id
 * @property string $name
 * 
 * @property Collection|Payment[] $payments
 *
 * @package App\Models\Base
 */
class PaymentMethod extends Model
{
	protected $table = 'payment_methods';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
	];

	public function payments()
	{
		return $this->hasMany(Payment::class);
	}
}
