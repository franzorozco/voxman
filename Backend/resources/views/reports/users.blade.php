<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Usuarios</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #111;
            margin: 20px;
        }

        /* ================= HEADER ================= */
        .header {
            text-align: center;
            margin-bottom: 15px;
        }

        .header img {
            max-height: 60px;
            margin-bottom: 10px;
        }

        .header h1 {
            font-size: 16px;
            margin: 0;
            letter-spacing: 1px;
        }

        .header small {
            font-size: 10px;
            color: #555;
        }

        /* ================= SECCIONES ================= */
        .section {
            margin-bottom: 15px;
            border: 1px solid #ddd;
            padding: 10px;
        }

        .section-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }

        /* ================= AUDITORÍA ================= */
        .audit-table {
            width: 100%;
        }

        .audit-table td {
            padding: 3px 0;
            vertical-align: top;
        }

        .label {
            font-weight: bold;
            width: 160px;
            color: #333;
        }

        /* ================= TABLA ================= */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            border: 1px solid #ccc;
            padding: 6px;
            font-size: 10px;
            background: #f2f2f2;
            text-align: left;
        }

        td {
            border: 1px solid #ddd;
            padding: 5px;
            font-size: 10px;
        }

        /* ================= FOOTER ================= */
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #666;
        }

        /* ================= BADGES SIMPLES ================= */
        .badge {
            font-size: 9px;
            padding: 2px 5px;
            border: 1px solid #999;
            display: inline-block;
        }
    </style>
</head>

<body>

<!-- ================= HEADER ================= -->
<div class="header">

    <!-- LOGO (ruta editable) -->
    <img src="RUTA_DE_TU_LOGO_AQUI/logo.png" alt="Logo">

    <h1>REPORTE DE USUARIOS</h1>
    <small>Sistema de Gestión Administrativa</small>
</div>

<!-- ================= AUDITORÍA ================= -->
<div class="section">
    <div class="section-title">Información de Auditoría</div>

    <table class="audit-table">
        <tr>
            <td class="label">ID Reporte:</td>
            <td>RPT-{{ now()->format('YmdHis') }}-{{ $authUser?->id ?? 'SYS' }}</td>
        </tr>

        <tr>
            <td class="label">Generado por:</td>
            <td>
                {{ $authUser?->profile?->first_name ?? '' }}
                {{ $authUser?->profile?->last_name_paternal ?? '' }}
                {{ $authUser?->profile?->last_name_maternal ?? '' }}
                ({{ $authUser?->email ?? 'Sistema' }})
            </td>
        </tr>

        <tr>
            <td class="label">Rol:</td>
            <td>{{ optional($authUser->roles)->pluck('name')->join(', ') ?? 'Sin rol' }}</td>
        </tr>

        <tr>
            <td class="label">Usuario ID:</td>
            <td>#{{ auth()->id() }}</td>
        </tr>

        <tr>
            <td class="label">Fecha:</td>
            <td>{{ now()->format('d/m/Y H:i:s') }}</td>
        </tr>

        <tr>
            <td class="label">Módulo:</td>
            <td>Gestión de Usuarios</td>
        </tr>

        <tr>
            <td class="label">Registros:</td>
            <td>{{ count($users) }}</td>
        </tr>

        <tr>
            <td class="label">Estado:</td>
            <td>Generación exitosa</td>
        </tr>
    </table>
</div>

<!-- ================= FILTROS ================= -->
<div class="section">
    <div class="section-title">Filtros Aplicados</div>

    @if(empty(array_filter($filters)))
        <p>Sin filtros aplicados (reporte completo)</p>
    @else
        <table>
            @foreach($filters as $key => $value)
                @if(!empty($value))
                    <tr>
                        <td class="label">{{ strtoupper($key) }}</td>
                        <td>{{ is_array($value) ? implode(', ', $value) : $value }}</td>
                    </tr>
                @endif
            @endforeach
        </table>
    @endif
</div>

<!-- ================= TABLA ================= -->
<div class="section">
    <div class="section-title">Listado de Usuarios</div>

    <table>
        <thead>
            <tr>
                <th>Email</th>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Tipo</th>
                <th>Roles</th>
                <th>Código</th>
                <th>Puntos</th>
                <th>Compras</th>
                <th>Fecha</th>
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
                        <span class="badge">Activo</span>
                    @else
                        <span class="badge">Inactivo</span>
                    @endif
                </td>

                <td>
                    @if($u->owner)
                        Owner
                    @elseif($u->customer)
                        Customer
                    @else
                        -
                    @endif
                </td>

                <td>{{ $u->roles->pluck('name')->join(', ') ?: '-' }}</td>

                <td>{{ $u->customer->customer_code ?? '-' }}</td>
                <td>{{ $u->customer->points ?? 0 }}</td>
                <td>{{ $u->customer->total_purchases ?? 0 }}</td>

                <td>{{ $u->created_at->format('d/m/Y') }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
</div>

<!-- ================= FOOTER ================= -->
<div class="footer">
    Documento generado automáticamente • Sistema de gestión • Confidencial
</div>

</body>
</html>