<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\Role;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ModelHasRole
 * 
 * @property int $role_id
 * @property string $model_type
 * @property uuid $model_id
 * 
 * @property Role $role
 *
 * @package App\Models\Base
 */
class ModelHasRole extends Model
{
	protected $table = 'model_has_roles';
	protected $keyType = 'string';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'role_id' => 'int',
	];

	public function role()
	{
		return $this->belongsTo(Role::class);
	}
}
