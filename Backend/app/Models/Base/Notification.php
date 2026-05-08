<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Notification
 * 
 * @property string $id
 * @property string|null $customer_id
 * @property string|null $title
 * @property string|null $message
 * @property string|null $type
 * @property bool|null $is_read
 * @property Carbon|null $created_at
 * 
 * @property Customer|null $customer
 *
 * @package App\Models\Base
 */
class Notification extends Model
{
	protected $table = 'notifications';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'is_read' => 'bool',
	];

	public function customer()
	{
		return $this->belongsTo(Customer::class);
	}
}