<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CashTransfer extends Model
{
    protected $table = 'cash_transfers';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'from_branch_id',
        'to_branch_id',
        'amount',
        'status',
        'transfer_date',
        'notes',
        'created_by'
    ];

    protected $casts = [
        'transfer_date' => 'datetime',
        'amount' => 'decimal:2'
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (!$model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function from_branch()
    {
        return $this->belongsTo(\App\Models\Branch\Branch::class, 'from_branch_id');
    }

    public function to_branch()
    {
        return $this->belongsTo(\App\Models\Branch\Branch::class, 'to_branch_id');
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\Auth\User::class, 'created_by');
    }
}
