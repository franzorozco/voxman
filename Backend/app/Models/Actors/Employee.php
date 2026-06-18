<?php
namespace App\Models\Actors;

use App\Models\Base\Employee as BaseEmployee;

class Employee extends BaseEmployee
{
    protected $fillable = [
        'user_id',
        'branch_id',
        'role',
        'employee_code',
        'phone',
        'emergency_contact',
        'base_salary',
        'commission_percentage',
        'max_discount_allowed',
        'can_approve_returns',
        'can_manage_inventory',
        'hire_date',
        'contract_type',
        'status',
        'is_active',
        'last_promotion_date',
        'notes'
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\Core\User::class, 'user_id');
    }

    public function sales()
    {
        return $this->hasMany(\App\Models\Sales\Sale::class, 'employee_id');
    }
}