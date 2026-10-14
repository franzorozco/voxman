<?php

namespace App\Models\Core;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Models\Base\User as BaseUser;
use Illuminate\Support\Str;
use Illuminate\Notifications\Notifiable;

class User extends BaseUser
{
	use HasApiTokens, HasRoles, \App\Traits\Auditable, Notifiable;
	protected $guard_name = 'web';
	protected $hidden = [
		'password'
	];

	protected $fillable = [
		'email',
		'username',
		'password',
		'last_login',
		'is_active',
		'email_verified_at',
		'google_id',
		'avatar'
	];

	/**
	 * Garantiza que la columna email_verified_at exista en PostgreSQL y que las cuentas
	 * preexistentes queden marcadas como verificadas automáticamente.
	 */
	public static function ensureEmailVerificationSchema(): void
	{
		try {
			if (!\Illuminate\Support\Facades\Cache::get('schema_users_email_verified_at_ready')) {
				if (!\Illuminate\Support\Facades\Schema::hasColumn('users', 'email_verified_at')) {
					\Illuminate\Support\Facades\Schema::table('users', function (\Illuminate\Database\Schema\Blueprint $table) {
						$table->timestamp('email_verified_at')->nullable();
					});

					\Illuminate\Support\Facades\DB::table('users')
						->whereNull('email_verified_at')
						->update([
							'email_verified_at' => \Illuminate\Support\Facades\DB::raw('COALESCE(created_at, NOW())'),
						]);
				}
				\Illuminate\Support\Facades\Cache::put('schema_users_email_verified_at_ready', true, now()->addDays(7));
			}
		} catch (\Throwable $e) {
			\Illuminate\Support\Facades\Log::warning('ensureEmailVerificationSchema: ' . $e->getMessage());
		}
	}

	/**
	 * Elimina FÍSICAMENTE (forceDelete) las cuentas web que:
	 * - NO han verificado su correo (email_verified_at IS NULL)
	 * - NO están vinculadas con Google (google_id IS NULL)
	 * - Llevan más de $hours horas sin verificarse
	 * - NO tienen ventas, ni son empleados/propietarios
	 *
	 * Se eliminan físicamente (y no lógicamente con deleted_at) para NO bloquear el correo
	 * durante 60 días si alguien escribió un correo ajeno o equivocado sin verificarlo.
	 */
	public static function purgeExpiredUnverifiedUsers(int $hours = 24): int
	{
		self::ensureEmailVerificationSchema();

		$cutoff = now()->subHours($hours);
		$expiredUsers = self::withTrashed()
			->whereNull('email_verified_at')
			->whereNull('google_id')
			->where('updated_at', '<', $cutoff)
			->whereDoesntHave('sales')
			->whereDoesntHave('employee')
			->whereDoesntHave('owner')
			->get();

		$deletedCount = 0;

		foreach ($expiredUsers as $expiredUser) {
			try {
				\Illuminate\Support\Facades\DB::transaction(function () use ($expiredUser) {
					$expiredUser->tokens()->delete();
					\Illuminate\Support\Facades\DB::table('model_has_roles')
						->where('model_id', $expiredUser->id)
						->delete();
					\App\Models\Core\UserProfile::withTrashed()
						->where('user_id', $expiredUser->id)
						->forceDelete();

					$customer = \App\Models\Actors\Customer::withTrashed()
						->where('user_id', $expiredUser->id)
						->first();
					if ($customer && !$customer->sales()->exists()) {
						$customer->forceDelete();
					}

					$expiredUser->forceDelete();
				});
				$deletedCount++;
			} catch (\Throwable $e) {
				\Illuminate\Support\Facades\Log::warning('purgeExpiredUnverifiedUsers error: ' . $e->getMessage());
			}
		}

		return $deletedCount;
	}

	protected static function boot()
	{
		parent::boot();

		static::creating(function ($model) {
			if (!$model->id) {
				$model->id = (string) Str::uuid();
			}
		});
	}

	public function sendPasswordResetNotification($token)
	{
		$this->notify(new \App\Notifications\CustomResetPasswordNotification($token, $this->email));
	}

	public function profile()
	{
		return $this->hasOne(UserProfile::class);
	}
	public function owner()
	{
		return $this->hasOne(\App\Models\Actors\Owner::class, 'user_id');
	}

	public function customer()
	{
		return $this->hasOne(\App\Models\Actors\Customer::class, 'user_id');
	}
	
	public function employee()
	{
		return $this->hasOne(\App\Models\Actors\Employee::class, 'user_id');
	}
}
