<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Branch;
use App\Models\CashMovement;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class CashRegister
 * 
 * @property uuid $id
 * @property uuid|null $branch_id
 * @property uuid|null $user_id
 * @property float $opening_amount
 * @property float|null $closing_amount
 * @property Carbon $opened_at
 * @property Carbon|null $closed_at
 * @property string|null $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Branch|null $branch
 * @property User|null $user
 * @property Collection|CashMovement[] $cash_movements
 * @property Collection|Payment[] $payments
 *
 * @package App\Models\Base
 */
class CashRegister extends Model
{
	use SoftDeletes;
	protected $table = 'cash_registers';
	public $incrementing = false;

	protected $casts = [
		'id' => 'uuid',
		'branch_id' => 'uuid',
		'user_id' => 'uuid',
		'opening_amount' => 'float',
		'closing_amount' => 'float',
		'opened_at' => 'datetime',
		'closed_at' => 'datetime'
	];

	public function branch()
	{
		return $this->belongsTo(Branch::class);
	}

	public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function cash_movements()
	{
		return $this->hasMany(CashMovement::class);
	}

	public function payments()
	{
		return $this->hasMany(Payment::class);
	}
}
