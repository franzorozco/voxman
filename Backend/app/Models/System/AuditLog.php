<?php

namespace App\Models;

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
}
