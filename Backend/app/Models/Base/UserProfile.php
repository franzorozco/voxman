<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models\Base;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class UserProfile
 * 
 * @property uuid $id
 * @property uuid|null $user_id
 * @property string $first_name
 * @property string|null $last_name_paternal
 * @property string|null $last_name_maternal
 * @property string|null $phone
 * @property Carbon|null $birthdate
 * @property string|null $gender
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property User|null $user
 *
 * @package App\Models\Base
 */
class UserProfile extends Model
{
    use SoftDeletes;

    protected $table = 'user_profiles';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'birthdate' => 'datetime',
    ];

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name_paternal',
        'last_name_maternal',
        'phone',
        'birthdate',
        'gender',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
