<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\CashRegister;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class CashMovement
 * 
 * @property uuid $id
 * @property uuid|null $cash_register_id
 * @property USER-DEFINED $movement_type
 * @property float $amount
 * @property string|null $reference_type
 * @property uuid|null $reference_id
 * @property string|null $description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property CashRegister|null $cash_register
 *
 * @package App\Models\Base
 */
class CashMovement extends Model
{
	use SoftDeletes;
	protected $table = 'cash_movements';
	protected $keyType = 'string';
	public $incrementing = false;

	protected $casts = [
		'movement_type' => 'USER-DEFINED',
		'amount' => 'float',
	];

	public function cash_register()
	{
		return $this->belongsTo(CashRegister::class);
	}
}
