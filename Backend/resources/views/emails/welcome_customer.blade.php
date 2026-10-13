<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>¡Bienvenido/a a {{ $storeName }}! Tu cuenta ha sido creada</title>
    <style>
        @media only screen and (max-width: 600px) {
            .email-wrapper { width: 100% !important; }
            .email-body { padding: 32px 20px !important; }
            .btn-td { padding: 0 4px !important; }
            .btn-cta {
                display: block !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
                text-align: center !important;
            }
            .signature-table { width: 100% !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust:none;">

    <!-- Wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5; margin:0; padding:0;">
        <tr>
            <td align="center" style="padding: 40px 16px;">

                <!-- Card -->
                <table class="email-wrapper" width="560" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08);">

                    <!-- Header con logo -->
                    <tr>
                        <td align="center" style="background-color:#18181b; padding: 36px 40px 28px 40px;">
                            <a href="{{ $appUrl }}" style="display:inline-block; text-decoration:none;">
                                <img src="{{ $logoHeaderUrl }}" alt="{{ $storeName }}" width="160" style="display:block; width:160px; height:auto; border:0;" />
                            </a>
                        </td>
                    </tr>

                    <!-- Línea de acento -->
                    <tr>
                        <td style="height:3px; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);"></td>
                    </tr>

                    <!-- Cuerpo del correo -->
                    <tr>
                        <td class="email-body" style="padding: 48px 48px 40px 48px;">

                            <!-- Eyebrow -->
                            <p style="margin:0 0 8px 0; font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#a1a1aa;">
                                Bienvenida a nuestra plataforma
                            </p>

                            <!-- Título principal -->
                            <h1 style="margin:0 0 28px 0; font-size:26px; font-weight:700; color:#18181b; line-height:1.25;">
                                ¡Tu cuenta está lista, {{ $customerName }}!
                            </h1>

                            <!-- Saludo -->
                            <p style="margin:0 0 16px 0; font-size:15px; line-height:1.7; color:#52525b;">
                                Hemos creado tu cuenta en <strong>{{ $storeName }}</strong> para que puedas acceder a nuestra tienda en línea, revisar tu historial de compras y gestionar tu perfil.
                            </p>

                            <!-- Caja de credenciales -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                                <tr>
                                    <td style="background-color:#f8f8ff; border-radius:10px; border: 1px solid #e0e0ff; border-left: 4px solid #6366f1; padding: 24px;">

                                        <p style="margin:0 0 14px 0; font-size:13px; font-weight:700; color:#6366f1; text-transform:uppercase; letter-spacing:1px;">
                                            Tus Credenciales de Acceso
                                        </p>

                                        <!-- Correo -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
                                            <tr>
                                                <td width="110" style="font-size:13px; color:#71717a; font-weight:600; padding: 6px 0;">
                                                    Correo:
                                                </td>
                                                <td style="font-size:14px; color:#18181b; font-weight:500; padding: 6px 0;">
                                                    {{ $customerEmail }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="110" style="font-size:13px; color:#71717a; font-weight:600; padding: 6px 0;">
                                                    Contraseña:
                                                </td>
                                                <td style="padding: 6px 0;">
                                                    <span style="font-family: 'Courier New', Courier, monospace; font-size:16px; font-weight:700; color:#18181b; background-color:#ede9fe; padding: 4px 10px; border-radius:6px; letter-spacing:2px; display:inline-block;">
                                                        {{ $temporaryPassword }}
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>
                            </table>

                            <!-- Aviso de seguridad -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                                <tr>
                                    <td style="background-color:#fffbeb; border-radius:8px; border-left: 4px solid #f59e0b; padding: 14px 16px;">
                                        <p style="margin:0; font-size:13px; color:#92400e; line-height:1.6;">
                                            🔐 <strong>Importante:</strong> Por tu seguridad, te recomendamos cambiar esta contraseña temporal la primera vez que inicies sesión. Puedes hacerlo desde tu perfil en la tienda.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Botón CTA principal -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                                <tr>
                                    <td align="center" class="btn-td" style="padding: 0;">
                                        <a href="{{ $loginUrl }}" class="btn-cta" target="_blank" rel="noopener"
                                           style="display:inline-block; background-color:#6366f1; color:#ffffff; font-size:15px; font-weight:700; letter-spacing:0.5px; text-decoration:none; padding:15px 44px; border-radius:10px; border:none; box-sizing:border-box; width:100%; text-align:center;">
                                            Iniciar Sesión Ahora →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Nota final -->
                            <p style="margin:28px 0 0 0; font-size:13px; line-height:1.7; color:#a1a1aa; text-align:center;">
                                Si no solicitaste esta cuenta o crees que esto es un error,<br />
                                por favor comunícate con nosotros respondiendo a este correo<br />
                                o a través de <a href="{{ $appUrl }}" style="color:#6366f1; text-decoration:none;">{{ $storeName }}</a>.
                            </p>

                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="height:1px; background-color:#e4e4e7;"></td>
                    </tr>

                    <!-- Firma VOXMAN -->
                    <tr>
                        <td style="padding: 32px 48px 36px 48px;">
                            <table class="signature-table" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <!-- Logo pequeño firma -->
                                    <td valign="middle" style="padding-right: 20px;">
                                        <img
                                            src="{{ $logoSignatureUrl }}"
                                            alt="{{ $storeName }}"
                                            width="80"
                                            style="display:block; width:80px; height:auto; border:0;"
                                        />
                                    </td>
                                    <!-- Separador vertical -->
                                    <td valign="middle" style="width:1px; background-color:#e4e4e7; padding:0; margin:0;">
                                        <div style="width:1px; height:60px; background-color:#e4e4e7;"></div>
                                    </td>
                                    <!-- Info firma -->
                                    <td valign="middle" style="padding-left: 20px;">
                                        <p style="margin:0 0 2px 0; font-size:13px; font-weight:700; color:#18181b; letter-spacing:0.3px;">
                                            V Ø X &nbsp; M A N
                                        </p>
                                        <p style="margin:0 0 6px 0; font-size:11px; color:#a1a1aa; letter-spacing:0.5px; text-transform:uppercase;">
                                            Sistema Administrativo
                                        </p>
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            @if($appUrl)
                                            <tr>
                                                <td style="padding-bottom:3px;">
                                                    <a href="{{ $appUrl }}" style="font-size:12px; color:#52525b; text-decoration:none;">🌐 {{ str_replace(['http://', 'https://'], '', $appUrl) }}</a>
                                                </td>
                                            </tr>
                                            @endif
                                            @if($storePhone)
                                            <tr>
                                                <td style="padding-bottom:3px;">
                                                    <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $storePhone) }}" style="font-size:12px; color:#52525b; text-decoration:none;">📱 {{ $storePhone }}</a>
                                                </td>
                                            </tr>
                                            @endif
                                            @if($storeAddress)
                                            <tr>
                                                <td>
                                                    <p style="margin:0; font-size:12px; color:#a1a1aa;">📍 {{ $storeAddress }}</p>
                                                </td>
                                            </tr>
                                            @endif
                                        </table>
                                        <!-- Redes sociales -->
                                        <table cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                                            <tr>
                                                @if($tiktokUrl)
                                                <td style="padding-right:10px;">
                                                    <a href="{{ $tiktokUrl }}" style="font-size:11px; color:#52525b; text-decoration:none; font-weight:600;">TikTok</a>
                                                </td>
                                                @endif
                                                @if($facebookUrl)
                                                    @if($tiktokUrl)
                                                    <td style="padding-right:10px; color:#d4d4d8;">|</td>
                                                    @endif
                                                <td style="padding-right:10px;">
                                                    <a href="{{ $facebookUrl }}" style="font-size:11px; color:#52525b; text-decoration:none; font-weight:600;">Facebook</a>
                                                </td>
                                                @endif
                                                @if($instagramUrl)
                                                    @if($tiktokUrl || $facebookUrl)
                                                    <td style="padding-right:10px; color:#d4d4d8;">|</td>
                                                    @endif
                                                <td>
                                                    <a href="{{ $instagramUrl }}" style="font-size:11px; color:#52525b; text-decoration:none; font-weight:600;">Instagram</a>
                                                </td>
                                                @endif
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color:#fafafa; border-top:1px solid #e4e4e7; padding: 20px 40px; border-radius: 0 0 12px 12px;">
                            <p style="margin:0; font-size:11px; color:#a1a1aa; text-align:center; letter-spacing:0.3px;">
                                © {{ date('Y') }} {{ $storeName }}. Todos los derechos reservados.
                                <br />
                                <span style="font-size:10px;">Este es un correo automático, por favor no respondas directamente a este mensaje.</span>
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- / Card -->

            </td>
        </tr>
    </table>

</body>
</html>
