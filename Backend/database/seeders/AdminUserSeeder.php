<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Core\User;
use App\Models\Core\UserProfile;

class AdminUserSeeder extends Seeder
{
    public function run()
    {
        $user = User::firstOrCreate(
            ['email' => 'ftanzorozco0@gmail.com'],
            [
                'username' => 'admin',
                'password' => Hash::make('123456'),
                'is_active' => true,
            ]
        );

        UserProfile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'first_name' => 'Franz',
                'last_name_paternal' => 'Orozco',
                'phone' => '63194677',
            ]
        );

        $user->assignRole('Owner');
    }
}