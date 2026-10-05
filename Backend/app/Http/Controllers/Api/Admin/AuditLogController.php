<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\System\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Retrieve paginated audit logs with user info.
     */
    public function index(Request $request)
    {
        try {
            $logs = AuditLog::with('user.profile')
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json($logs, 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener los registros de auditoría',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
