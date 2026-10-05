<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class AuditLog
 * 
 * @property uuid $id
 * @property uuid|null $user_id
 * @property string|null $action
 * @property string|null $table_name
 * @property uuid|null $record_id
 * @property string|null $old_data
 * @property string|null $new_data
 * @property Carbon|null $created_at
 * 
 * @property User|null $user
 *
 * @package App\Models\Base
 */
class AuditLog extends Model
{
	protected $table = 'audit_logs';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'old_data' => 'binary',
		'new_data' => 'binary'
	];

	public function user()
	{
		return $this->belongsTo(User::class);
	}
}
