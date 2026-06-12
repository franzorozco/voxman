<?php

namespace App\Models\Discount;

use App\Models\Base\Discount as BaseDiscount;

class Discount extends BaseDiscount
{
	protected $fillable = [
		'name',
		'type',
		'value',
		'code',
		'is_automatic',
		'min_purchase_amount',
		'min_quantity',
		'max_discount_amount',
		'usage_limit',
		'used_count',
		'start_date',
		'end_date',
		'active'
	];

    public function variants()
    {
        return $this->belongsToMany(\App\Models\Catalog\ProductVariant::class, 'discount_variants', 'discount_id', 'variant_id');
    }

    public function branches()
    {
        return $this->belongsToMany(\App\Models\Branch\Branch::class, 'discount_branches', 'discount_id', 'branch_id');
    }

    public function customers()
    {
        return $this->belongsToMany(\App\Models\Actors\Customer::class, 'discount_customers', 'discount_id', 'customer_id');
    }

    public function employees()
    {
        return $this->belongsToMany(\App\Models\Actors\Employee::class, 'discount_employees', 'discount_id', 'employee_id');
    }
}
