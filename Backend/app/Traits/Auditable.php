<?php

namespace App\Traits;

use App\Models\System\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            self::logAudit('create', $model);
        });

        static::updated(function ($model) {
            self::logAudit('update', $model);
        });

        static::deleted(function ($model) {
            self::logAudit('delete', $model);
        });
    }

    protected static function logAudit($action, $model)
    {
        $oldData = null;
        $newData = null;

        if ($action === 'create') {
            $newData = $model->getAttributes();
        } elseif ($action === 'update') {
            $oldData = array_intersect_key($model->getOriginal(), $model->getDirty());
            $newData = $model->getDirty();
        } elseif ($action === 'delete') {
            $oldData = $model->getAttributes();
        }

        if ($action === 'update' && empty($newData)) {
            return;
        }

        try {
            AuditLog::create([
                'user_id' => Auth::id(), 
                'action' => $action,
                'table_name' => $model->getTable(),
                'record_id' => $model->getKey(),
                'old_data' => $oldData ? json_encode($oldData) : null,
                'new_data' => $newData ? json_encode($newData) : null,
            ]);
        } catch (\Exception $e) {
            \Log::error('AuditLog Error: ' . $e->getMessage());
        }
    }
}
