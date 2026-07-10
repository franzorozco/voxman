<?php

namespace App\Models\Auth;



use Spatie\Permission\Models\Role as SpatieRole;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends SpatieRole
{
	use SoftDeletes;

	protected $fillable = [
		'name',
		'guard_name',
		'is_employee',
		'is_customer'
	];

	protected $casts = [
		'is_employee' => 'boolean',
		'is_customer' => 'boolean'
	];

    public function users(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->morphedByMany(
            \App\Models\Core\User::class,
            'model',
            config('permission.table_names.model_has_roles'),
            config('permission.column_names.role_pivot_key'),
            config('permission.column_names.model_morph_key')
        );
    }
}
