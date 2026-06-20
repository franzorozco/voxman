<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Branch;
use App\Models\ExpenseSplit;
use App\Models\Owner;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Expense
 * 
 * @property uuid $id
 * @property uuid|null $branch_id
 * @property string|null $name
 * @property float|null $amount
 * @property Carbon|null $expense_date
 * @property string|null $type
 * @property Carbon|null $created_at
 * @property string|null $split_type
 * 
 * @property Branch|null $branch
 * @property Collection|Owner[] $owners
 * @property Collection|ExpenseSplit[] $expense_splits
 *
 * @package App\Models\Base
 */
class Expense extends Model
{
	protected $table = 'expenses';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'id' => 'uuid',
		'branch_id' => 'uuid',
		'amount' => 'float',
		'expense_date' => 'datetime'
	];

	public function branch()
	{
		return $this->belongsTo(Branch::class);
	}

	public function owners()
	{
		return $this->belongsToMany(Owner::class, 'owner_expense_shares')
					->withPivot('id', 'percentage', 'amount');
	}

	public function expense_splits()
	{
		return $this->hasMany(ExpenseSplit::class);
	}
}
