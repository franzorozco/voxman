<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Finance\Expense;
use App\Models\Actors\Owner;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ExpenseSplit
 * 
 * @property uuid $id
 * @property uuid|null $expense_id
 * @property uuid|null $owner_id
 * @property float $amount
 * @property float|null $percentage
 * @property Carbon|null $created_at
 * 
 * @property Expense|null $expense
 * @property Owner|null $owner
 *
 * @package App\Models\Base
 */
class ExpenseSplit extends Model
{
	protected $table = 'expense_splits';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'string',
		'expense_id' => 'string',
		'owner_id' => 'string',
		'amount' => 'float',
		'percentage' => 'float'
	];

	public function expense()
	{
		return $this->belongsTo(Expense::class);
	}

	public function owner()
	{
		return $this->belongsTo(Owner::class);
	}
}
