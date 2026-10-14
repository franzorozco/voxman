<?php

// app/Http/Requests/Auth/RegisterRequest.php

namespace App\Http\Requests\Auth;

use App\Models\Core\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    /**
     * Normaliza antes de validar: correo en minúsculas y username automático desde el correo (sin @dominio).
     */
    protected function prepareForValidation(): void
    {
        $normalizedEmail = is_string($this->email) ? Str::lower(trim($this->email)) : $this->email;

        $rawUsername = is_string($this->username) ? trim($this->username) : '';
        if ($rawUsername !== '' && str_contains($rawUsername, '@')) {
            $rawUsername = trim(Str::before($rawUsername, '@'));
        }
        if ($rawUsername === '' && is_string($normalizedEmail) && str_contains($normalizedEmail, '@')) {
            $rawUsername = trim(Str::before($normalizedEmail, '@'));
        }

        $this->merge([
            'email'    => $normalizedEmail,
            'username' => Str::limit($rawUsername, 50, ''),
        ]);
    }

    public function rules()
    {
        return [
            'email' => [
                'required', 'string', 'email', 'max:150',
                function ($attribute, $value, $fail) {
                    User::ensureEmailVerificationSchema();
                    User::purgeExpiredUnverifiedUsers(24);

                    $existingUser = User::withTrashed()
                        ->with(['customer' => fn($q) => $q->withTrashed()])
                        ->whereRaw('LOWER(email) = ?', [Str::lower($value)])
                        ->first();

                    if (!$existingUser) {
                        return;
                    }

                    $deletedAt = $existingUser->deleted_at ?? $existingUser->customer?->deleted_at;

                    if ($deletedAt === null) {
                        // Si la cuenta nunca fue verificada y no es de Google, permitimos reenviar/actualizar registro para verificarla
                        if ($existingUser->email_verified_at === null && $existingUser->google_id === null) {
                            return;
                        }

                        $fail('Advertencia: Este correo electrónico ya está registrado y verificado. No se puede sobrescribir una cuenta activa.');
                        return;
                    }

                    $daysDeleted = (int) floor(\Carbon\Carbon::parse($deletedAt)->diffInDays(now()));
                    if ($daysDeleted < 60) {
                        $daysRemaining = max(1, 60 - $daysDeleted);
                        $fail("Advertencia: Este correo pertenece a una cuenta eliminada hace {$daysDeleted} día(s). Deben pasar más de 60 días para poder volver a crearla (faltan {$daysRemaining} día(s)).");
                    }
                },
            ],
            'username' => ['nullable', 'string', 'max:50'],
            // 🔒 max:72 — bcrypt solo usa 72 bytes; sin tope, una contraseña de 100 KB tardaba 5.5 s (DoS)
            'password' => ['required', 'string', 'confirmed', 'max:72', Password::min(8)->letters()->numbers()],

            // Límites alineados con las columnas de la BD
            'first_name'         => 'nullable|string|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'phone'              => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s()]*$/'],
        ];
    }

    public function messages()
    {
        return [
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email'    => 'Ingresa un correo electrónico válido.',
            'phone.regex'    => 'El teléfono solo puede contener números, espacios y los símbolos + - ( ).',
        ];
    }
}