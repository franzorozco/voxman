<?php

namespace App\Models\Base;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    protected $table = 'employees';
    protected $keyType = 'string';

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

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function purchaseReceptions()
    {
        return $this->hasMany(PurchaseReception::class);
    }

    public function cashRegisters()
    {
        return $this->hasMany(CashRegister::class);
    }

    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }





}