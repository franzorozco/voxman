<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\ModelHasRole;
use App\Models\Permission;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Role
 * 
 * @property int $id
 * @property string $name
 * @property string $guard_name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Collection|ModelHasRole[] $model_has_roles
 * @property Collection|Permission[] $permissions
 *
 * @package App\Models\Base
 */
class Role extends Model
{
	use SoftDeletes;
	protected $table = 'roles';

	public function model_has_roles()
	{
		return $this->hasMany(ModelHasRole::class);
	}

	public function permissions()
	{
		return $this->belongsToMany(Permission::class, 'role_has_permissions');
	}
}
