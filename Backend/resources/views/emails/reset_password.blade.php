<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Recuperación de Contraseña — VOXMAN</title>
    <style>
        @media only screen and (max-width: 600px) {
            .email-wrapper { width: 100% !important; }
            .email-body { padding: 32px 20px !important; }
            .btn-td { padding: 0 4px !important; }
            .btn-reset {
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
                                <img
                                    src="{{ $logoHeaderUrl }}"
                                    alt="VOXMAN"
                                    width="160"
                                    style="display:block; width:160px; height:auto; border:0;"
                                />
                            </a>
                        </td>
                    </tr>

                    <!-- Línea de acento -->
                    <tr>
                        <td style="height:3px; background: linear-gradient(90deg, #18181b 0%, #52525b 100%);"></td>
                    </tr>

                    <!-- Cuerpo del correo -->
                    <tr>
                        <td class="email-body" style="padding: 48px 48px 40px 48px;">

                            <!-- Título -->
                            <p style="margin:0 0 8px 0; font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#a1a1aa;">
                                Seguridad de cuenta
                            </p>
                            <h1 style="margin:0 0 28px 0; font-size:26px; font-weight:700; color:#18181b; line-height:1.25;">
                                Restablecer contraseña
                            </h1>

                            <!-- Mensaje principal -->
                            <p style="margin:0 0 16px 0; font-size:15px; line-height:1.7; color:#52525b;">
                                Hola,
                            </p>
                            <p style="margin:0 0 32px 0; font-size:15px; line-height:1.7; color:#52525b;">
                                Recibiste este correo porque se solicitó restablecer la contraseña de tu cuenta en <strong style="color:#18181b;">VOXMAN</strong>. Si fuiste tú, haz clic en el botón de abajo para continuar.
                            </p>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 36px 0;">
                                <tr>
                                    <td align="center" class="btn-td" style="padding: 0;">
                                        <a
                                            href="{{ $resetUrl }}"
                                            class="btn-reset"
                                            target="_blank"
                                            rel="noopener"
                                            style="display:inline-block; background-color:#18181b; color:#ffffff; font-size:14px; font-weight:600; letter-spacing:0.5px; text-decoration:none; padding:14px 40px; border-radius:8px; border:none; box-sizing:border-box;"
                                        >
                                            Restablecer mi contraseña
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info caducidad -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa; border-radius:8px; border-left: 3px solid #18181b; margin-bottom:32px;">
                                <tr>
                                    <td style="padding: 16px 20px;">
                                        <p style="margin:0; font-size:13px; color:#71717a; line-height:1.6;">
                                            ⏱&nbsp; Este enlace expirará en <strong style="color:#18181b;">60 minutos</strong>.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Aviso de seguridad -->
                            <p style="margin:0 0 8px 0; font-size:13px; line-height:1.6; color:#a1a1aa;">
                                Si no solicitaste este cambio, puedes ignorar este correo con total tranquilidad. Tu contraseña no será modificada.
                            </p>

                            <!-- Enlace alternativo -->
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:
                                <br />
                                <a href="{{ $resetUrl }}" style="color:#52525b; word-break:break-all; font-size:11px;">{{ $resetUrl }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="height:1px; background-color:#e4e4e7; margin: 0 48px;"></td>
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
                                            alt="VOXMAN"
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
                                            Atención al cliente
                                        </p>
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-bottom:3px;">
                                                    <a href="https://voxman.shop" style="font-size:12px; color:#52525b; text-decoration:none;">🌐 voxman.shop</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom:3px;">
                                                    <a href="https://wa.me/59157003312" style="font-size:12px; color:#52525b; text-decoration:none;">📱 +591 57003312</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <p style="margin:0; font-size:12px; color:#a1a1aa;">📍 La Paz, Bolivia — Envíos a todo el país</p>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- Redes sociales -->
                                        <table cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                                            <tr>
                                                <td style="padding-right:10px;">
                                                    <a href="https://www.tiktok.com/@voxman.shop" style="font-size:11px; color:#52525b; text-decoration:none; font-weight:600;">TikTok</a>
                                                </td>
                                                <td style="padding-right:10px; color:#d4d4d8;">|</td>
                                                <td style="padding-right:10px;">
                                                    <a href="https://www.facebook.com/voxman.shop" style="font-size:11px; color:#52525b; text-decoration:none; font-weight:600;">Facebook</a>
                                                </td>
                                                <td style="padding-right:10px; color:#d4d4d8;">|</td>
                                                <td>
                                                    <a href="https://www.instagram.com/voxman.shop" style="font-size:11px; color:#52525b; text-decoration:none; font-weight:600;">Instagram</a>
                                                </td>
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
                                © {{ date('Y') }} VOXMAN. Todos los derechos reservados.
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
