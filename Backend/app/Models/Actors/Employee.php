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
}