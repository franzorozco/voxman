<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Usuarios</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #222;
        }

        /* ================= HEADER ================= */
        .header {
            text-align: center;
            margin-bottom: 10px;
        }

        .header h1 {
            font-size: 18px;
            margin: 0;
        }

        .header small {
            color: #666;
        }

        /* ================= AUDITORÍA ================= */
        .audit-box {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-size: 10px;
        }

        .audit-grid {
            display: table;
            width: 100%;
        }

        .audit-row {
            display: table-row;
        }

        .audit-label {
            display: table-cell;
            font-weight: bold;
            width: 140px;
            padding: 2px 0;
        }

        .audit-value {
            display: table-cell;
            color: #333;
        }

        /* ================= FILTROS ================= */
        .filters {
            background: #eef2ff;
            border-left: 4px solid #4f46e5;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }

        .filters h3 {
            margin: 0 0 5px 0;
            font-size: 12px;
            color: #4f46e5;
        }

        .filters ul {
            margin: 0;
            padding-left: 15px;
        }

        /* ================= TABLA ================= */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: #111827;
            color: white;
            padding: 8px;
            font-size: 10px;
            text-transform: uppercase;
        }

        td {
            border-bottom: 1px solid #ddd;
            padding: 6px;
            font-size: 10px;
        }

        tr:nth-child(even) {
            background: #f9fafb;
        }

        /* ================= BADGES ================= */
        .badge {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
        }

        .active { background: #dcfce7; color: #166534; }
        .inactive { background: #fee2e2; color: #991b1b; }

        .owner { background: #dbeafe; color: #1e3a8a; }
        .customer { background: #dcfce7; color: #14532d; }

        /* ================= FOOTER ================= */
        .footer {
            margin-top: 15px;
            font-size: 9px;
            text-align: center;
            color: #777;
        }

        .audit-box {
    background: linear-gradient(90deg, #f8fafc, #f1f5f9);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    margin-bottom: 15px;
}

.audit-label {
    font-weight: 600;
    color: #374151;
}

.audit-value {
    color: #111827;
}

    </style>
</head>

<body>

<!-- ================= HEADER ================= -->
<div class="header">
    <h1>REPORTE DE USUARIOS</h1>
    <small>Sistema de Gestión Administrativa</small>
</div>

<!-- ================= AUDITORÍA PROFESIONAL ================= -->
<div class="audit-box">

    <div style="border-bottom: 1px solid #ddd; margin-bottom: 8px; padding-bottom: 5px;">
        <strong style="font-size:12px; color:#111827;">
            🧾 INFORMACIÓN DE AUDITORÍA DEL SISTEMA
        </strong>
    </div>

    <div class="audit-grid">

        <div class="audit-row">
            <div class="audit-label">ID Reporte:</div>
            <div class="audit-value">RPT-{{ now()->format('YmdHis') }}-{{ auth()->id() }}</div>
        </div>

        <div class="audit-row">
            <div class="audit-label">Generado por:</div>
            <div class="audit-value">
                {{ $authUser?->profile?->first_name ?? '' }}
                {{ $authUser?->profile?->last_name_paternal ?? '' }}
                {{ $authUser?->profile?->last_name_maternal ?? '' }}
                ({{ $authUser?->email ?? 'Sistema' }})
            </div>
        </div>

        <div class="audit-row">
            <div class="audit-label">Rol del usuario:</div>
            <div class="audit-value">
                {{ $authUser?->roles?->pluck('name')?->join(', ') ?? 'Sin rol' }}
            </div>
        </div>

        <div class="audit-row">
            <div class="audit-label">Usuario ID:</div>
            <div class="audit-value">#{{ auth()->id() }}</div>
        </div>

        <div class="audit-row">
            <div class="audit-label">Fecha y hora:</div>
            <div class="audit-value">{{ now()->format('d/m/Y H:i:s') }}</div>
        </div>

        <div class="audit-row">
            <div class="audit-label">Módulo:</div>
            <div class="audit-value">Gestión de Usuarios</div>
        </div>

        <div class="audit-row">
            <div class="audit-label">Tipo de exportación:</div>
            <div class="audit-value">PDF (DOMPDF)</div>
        </div>

        <div class="audit-row">
            <div class="audit-label">Total registros:</div>
            <div class="audit-value">{{ count($users) }}</div>
        </div>

        <div class="audit-row">
            <div class="audit-label">Estado del sistema:</div>
            <div class="audit-value" style="color:green;">
                Generación exitosa
            </div>
        </div>

    </div>
</div>

<!-- ================= FILTROS PROFESIONALES ================= -->
<div class="filters">

    <h3>📌 Resumen de filtros aplicados</h3>

    @if(empty(array_filter($filters)))
        <p style="color:#6b7280;">Sin filtros aplicados (reporte completo)</p>
    @else
        <table style="width:100%; font-size:10px;">
            <tbody>
                @foreach($filters as $key => $value)
                    @if(!empty($value))
                        <tr>
                            <td style="width:140px; font-weight:bold;">
                                {{ strtoupper($key) }}
                            </td>
                            <td>
                                {{ is_array($value) ? implode(', ', $value) : $value }}
                            </td>
                        </tr>
                    @endif
                @endforeach
            </tbody>
        </table>
    @endif

</div>

<!-- ================= TABLA ================= -->
<table>
    <thead>
        <tr>
            <th>Email</th>
            <th>Usuario</th>
            <th>Nombre Completo</th>
            <th>Estado</th>
            <th>Tipo</th>
            <th>Roles</th>
            <th>Código</th>
            <th>Puntos</th>
            <th>Compras</th>
            <th>Fecha Registro</th>
        </tr>
    </thead>

    <tbody>
        @foreach($users as $u)
        <tr>
            <td>{{ $u->email }}</td>
            <td>{{ $u->username }}</td>

            <td>
                {{ $u->profile->first_name ?? '' }}
                {{ $u->profile->last_name_paternal ?? '' }}
                {{ $u->profile->last_name_maternal ?? '' }}
            </td>

            <td>
                @if($u->is_active)
                    <span class="badge active">Activo</span>
                @else
                    <span class="badge inactive">Inactivo</span>
                @endif
            </td>

            <td>
                @if($u->owner)
                    <span class="badge owner">Owner</span>
                @elseif($u->customer)
                    <span class="badge customer">Customer</span>
                @else
                    -
                @endif
            </td>

            <td>
                {{ $u->roles->pluck('name')->join(', ') ?: '-' }}
            </td>

            <td>
                {{ $u->customer->customer_code ?? '-' }}
            </td>

            <td>
                {{ $u->customer->points ?? 0 }}
            </td>

            <td>
                {{ $u->customer->total_purchases ?? 0 }}
            </td>

            <td>
                {{ $u->created_at->format('d/m/Y') }}
            </td>
        </tr>
        @endforeach
    </tbody>
</table>

<!-- ================= FOOTER ================= -->
<div class="footer">
    Documento generado automáticamente por el sistema • Confidencial
</div>

</body>
</html>

