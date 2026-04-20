<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte Usuario</title>

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

        /* ================= TABLA SIMPLE ================= */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        td {
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

    <img src="RUTA_DE_TU_LOGO/logo.png" alt="Logo">

    <h1>REPORTE INDIVIDUAL DE USUARIO</h1>
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
            <td>{{ $authUser?->roles?->pluck('name')->join(', ') ?? 'Sin rol' }}</td>
        </tr>

        <tr>
            <td class="label">Usuario ID:</td>
            <td>#{{ $authUser?->id ?? '-' }}</td>
        </tr>

        <tr>
            <td class="label">Fecha:</td>
            <td>{{ $generatedAt ?? now()->format('d/m/Y H:i:s') }}</td>
        </tr>

        <tr>
            <td class="label">Módulo:</td>
            <td>Gestión de Usuarios</td>
        </tr>

        <tr>
            <td class="label">Estado:</td>
            <td>Generación exitosa</td>
        </tr>

    </table>
</div>

<!-- ================= USUARIO ================= -->
<div class="section">
    <div class="section-title">Datos del Usuario</div>

    <table>
        <tr>
            <td class="label">Email:</td>
            <td>{{ $user->email }}</td>
        </tr>

        <tr>
            <td class="label">Usuario:</td>
            <td>{{ $user->username }}</td>
        </tr>

        <tr>
            <td class="label">Nombre:</td>
            <td>
                {{ $user->profile->first_name ?? '' }}
                {{ $user->profile->last_name_paternal ?? '' }}
                {{ $user->profile->last_name_maternal ?? '' }}
            </td>
        </tr>

        <tr>
            <td class="label">Estado:</td>
            <td>
                @if($user->is_active)
                    <span class="badge">Activo</span>
                @else
                    <span class="badge">Inactivo</span>
                @endif
            </td>
        </tr>

        <tr>
            <td class="label">Roles:</td>
            <td>{{ $user->roles->pluck('name')->join(', ') ?: '-' }}</td>
        </tr>
    </table>
</div>

<!-- ================= CLIENTE ================= -->
@if($user->customer)
<div class="section">
    <div class="section-title">Datos Cliente</div>

    <table>
        <tr>
            <td class="label">Código:</td>
            <td>{{ $user->customer->customer_code }}</td>
        </tr>

        <tr>
            <td class="label">Puntos:</td>
            <td>{{ $user->customer->points }}</td>
        </tr>

        <tr>
            <td class="label">Compras:</td>
            <td>{{ $user->customer->total_purchases }}</td>
        </tr>
    </table>
</div>
@endif

<!-- ================= FOOTER ================= -->
<div class="footer">
    Documento generado automáticamente • Sistema de gestión • Confidencial
</div>

</body>
</html>