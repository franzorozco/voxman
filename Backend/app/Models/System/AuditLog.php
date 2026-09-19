<?php

namespace App\Models\System;

use App\Models\Base\AuditLog as BaseAuditLog;

class AuditLog extends BaseAuditLog
{
	protected $fillable = [
		'user_id',
		'action',
		'table_name',
		'record_id',
		'old_data',
		'new_data'
	];

    protected $casts = [
        'old_data' => 'string',
        'new_data' => 'string'
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\Core\User::class, 'user_id');
    }
}
