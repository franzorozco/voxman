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
     * Normaliza antes de validar: correo en minúsculas y sin espacios.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email'    => is_string($this->email) ? Str::lower(trim($this->email)) : $this->email,
            'username' => is_string($this->username) ? trim($this->username) : $this->username,
        ]);
    }

    public function rules()
    {
        return [
            'email' => [
                'required', 'string', 'email', 'max:150',
                // Incluye cuentas eliminadas (soft delete) y no distingue mayúsculas:
                // el índice único de la BD las cuenta, y antes eso causaba un error 500.
                function ($attribute, $value, $fail) {
                    if (User::withTrashed()->whereRaw('LOWER(email) = ?', [Str::lower($value)])->exists()) {
                        $fail('Este correo no está disponible.');
                    }
                },
            ],
            'username' => [
                'required', 'string', 'min:3', 'max:50', 'regex:/^[A-Za-z0-9_]+$/',
                function ($attribute, $value, $fail) {
                    if (User::withTrashed()->whereRaw('LOWER(username) = ?', [Str::lower($value)])->exists()) {
                        $fail('Este nombre de usuario no está disponible.');
                    }
                },
            ],
            // 🔒 max:72 — bcrypt solo usa 72 bytes; sin tope, una contraseña de 100 KB tardaba 5.5 s (DoS)
            'password' => ['required', 'string', 'confirmed', 'max:72', Password::min(8)->letters()->numbers()],

            // Límites alineados con las columnas de la BD (antes un nombre largo causaba error 500 con SQL visible)
            'first_name'         => 'nullable|string|max:100',
            'last_name_paternal' => 'nullable|string|max:100',
            'last_name_maternal' => 'nullable|string|max:100',
            'phone'              => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s()]*$/'],
        ];
    }

    public function messages()
    {
        return [
            'username.regex' => 'El usuario solo puede tener letras, números y guiones bajos.',
            'phone.regex'    => 'El teléfono solo puede contener números, espacios y los símbolos + - ( ).',
        ];
    }
}