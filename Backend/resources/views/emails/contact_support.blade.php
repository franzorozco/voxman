<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Nuevo Mensaje de Contacto - {{ $storeName }}</title>
    <style>
        @media only screen and (max-width: 600px) {
            .email-wrapper { width: 100% !important; }
            .email-body { padding: 24px 16px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#0d0d0d; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d0d; margin:0; padding:30px 10px;">
        <tr>
            <td align="center">
                <table class="email-wrapper" width="580" cellpadding="0" cellspacing="0" border="0" style="background-color:#141414; border:1px solid #262626; border-radius:12px; overflow:hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color:#000000; padding: 26px 30px; border-bottom:1px solid #222;">
                            <img src="{{ $logoHeaderUrl }}" alt="{{ $storeName }}" width="140" style="display:block; width:140px; height:auto; border:0;" />
                        </td>
                    </tr>

                    <!-- Accent Line -->
                    <tr>
                        <td style="height:3px; background:#ffffff;"></td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td class="email-body" style="padding: 36px 36px 30px 36px; color:#ffffff;">
                            
                            <p style="margin:0 0 6px 0; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#a1a1aa;">
                                Centro de Contacto &amp; Soporte
                            </p>

                            <h2 style="margin:0 0 20px 0; font-size:22px; font-weight:700; color:#ffffff;">
                                Solicitud de Atención al Cliente
                            </h2>

                            <!-- Client Card Info -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1c1c1e; border:1px solid #333; border-radius:8px; margin-bottom:24px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin:0 0 8px 0; font-size:14px; color:#aaa;">
                                            <strong>Cliente:</strong> <span style="color:#fff;">{{ $clientName }}</span>
                                        </p>
                                        <p style="margin:0 0 8px 0; font-size:14px; color:#aaa;">
                                            <strong>Correo de la cuenta:</strong> <span style="color:#4ade80;">{{ $clientEmail }}</span> (Cuenta Verificada)
                                        </p>
                                        <p style="margin:0; font-size:14px; color:#aaa;">
                                            <strong>Asunto:</strong> <span style="color:#facc15; font-weight:600;">{{ $subjectText }}</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Message Body -->
                            <p style="margin:0 0 10px 0; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:#888;">
                                Contenido del mensaje:
                            </p>
                            
                            <div style="background-color:#09090b; border:1px solid #27272a; border-radius:8px; padding:18px; font-size:14px; line-height:1.6; color:#e4e4e7; white-space:pre-line; margin-bottom:28px;">{{ $messageBody }}</div>

                            <!-- Reply CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <a href="mailto:{{ $clientEmail }}?subject=Re:%20{{ urlencode($subjectText) }}" style="display:inline-block; background-color:#ffffff; color:#000000; text-decoration:none; padding:12px 26px; border-radius:6px; font-weight:600; font-size:14px;">
                                            Responder al Cliente
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color:#0a0a0a; padding: 20px; border-top:1px solid #222; font-size:12px; color:#666;">
                            <p style="margin:0 0 4px 0;">Este mensaje fue enviado a través del formulario de contacto oficial de {{ $storeName }}.</p>
                            <p style="margin:0;">El remitente cuenta con una cuenta de usuario activa y registrada en el sistema.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>
