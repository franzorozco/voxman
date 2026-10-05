<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Recibiste una Nueva Orden — VOXMAN</title>
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
            
            /* Responsive column stacking */
            .col-box { display: block !important; width: 100% !important; margin-bottom: 16px !important; }
            .col-spacer { display: none !important; }
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
                                <img src="{{ $logoHeaderUrl }}" alt="VOXMAN" width="160" style="display:block; width:160px; height:auto; border:0;" />
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
                                Notificación de Ventas
                            </p>
                            <h1 style="margin:0 0 28px 0; font-size:26px; font-weight:700; color:#18181b; line-height:1.25;">
                                ¡Recibiste una nueva orden!
                            </h1>

                            <!-- Mensaje principal -->
                            <p style="margin:0 0 16px 0; font-size:15px; line-height:1.7; color:#52525b;">
                                Hola <strong>{{ $ownerName }}</strong>,
                            </p>
                            <p style="margin:0 0 24px 0; font-size:15px; line-height:1.7; color:#52525b;">
                                Tienes una nueva orden que procesar. Estos son los datos principales del cliente:
                            </p>

                            <!-- Datos del Cliente -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                                <tr>
                                    <!-- Columna 1: Cliente -->
                                    <td width="48%" valign="top" class="col-box">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa; border-radius:8px; border-top: 3px solid #3b82f6; height:100%;">
                                            <tr>
                                                <td style="padding: 16px;">
                                                    <p style="margin:0 0 8px 0; font-size:12px; color:#71717a; text-transform:uppercase; font-weight:700;">Datos del Cliente</p>
                                                    <p style="margin:0 0 6px 0; font-size:14px; color:#18181b;"><strong>Nombre:</strong> {{ $customerFullName }}</p>
                                                    <p style="margin:0 0 6px 0; font-size:14px; color:#18181b;"><strong>Código:</strong> {{ $customerCode }}</p>
                                                    <p style="margin:0 0 6px 0; font-size:14px; color:#18181b;"><strong>Tipo:</strong> {{ $customerType }}</p>
                                                    <p style="margin:0; font-size:14px; color:#18181b;"><strong>Email:</strong> {{ $customerEmail ?? 'No registrado' }}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td width="4%" class="col-spacer"></td>
                                    <!-- Columna 2: Logística -->
                                    <td width="48%" valign="top" class="col-box">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa; border-radius:8px; border-top: 3px solid #10b981; height:100%;">
                                            <tr>
                                                <td style="padding: 16px;">
                                                    <p style="margin:0 0 8px 0; font-size:12px; color:#71717a; text-transform:uppercase; font-weight:700;">Logística</p>
                                                    <p style="margin:0 0 6px 0; font-size:14px; color:#18181b;"><strong>Ref. Carrito:</strong> {{ $referenceNumber }}</p>
                                                    <p style="margin:0; font-size:14px; color:#18181b; line-height: 1.4;"><strong>Entrega:</strong><br>{{ $deliveryDetails }}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            @if(!empty($otherOwnersText))
                            <div style="margin-bottom:16px; background-color:#fffbeb; border-left: 3px solid #f59e0b; padding:12px; border-radius:4px;">
                                <p style="margin:0; font-size:13px; color:#b45309; font-weight:600;">
                                    {{ $otherOwnersText }}
                                </p>
                            </div>
                            @endif

                            <p style="margin:0 0 16px 0; font-size:15px; line-height:1.7; color:#52525b; font-weight:600;">
                                Productos correspondientes a ti ({{ $ownerName }}):
                            </p>
                            
                            <!-- DIV CON SCROLL HORIZONTAL PARA RESPONSIVIDAD -->
                            <div style="overflow-x: auto; width: 100%; max-width: 100%; -webkit-overflow-scrolling: touch;">
                                <table class="item-list" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px; border-collapse: collapse; min-width: 400px;">
                                    <thead>
                                        <tr>
                                            <th align="left" style="padding-bottom:10px; border-bottom:1px solid #e4e4e7; font-size:12px; color:#a1a1aa; text-transform:uppercase;">Producto</th>
                                            <th align="center" style="padding-bottom:10px; border-bottom:1px solid #e4e4e7; font-size:12px; color:#a1a1aa; text-transform:uppercase;">Cant.</th>
                                            <th align="right" style="padding-bottom:10px; border-bottom:1px solid #e4e4e7; font-size:12px; color:#a1a1aa; text-transform:uppercase;">P. Unit</th>
                                            <th align="right" style="padding-bottom:10px; border-bottom:1px solid #e4e4e7; font-size:12px; color:#a1a1aa; text-transform:uppercase;">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach($items as $item)
                                        <tr>
                                            <td align="left" style="padding:12px 10px 12px 0; border-bottom:1px solid #f4f4f5; font-size:13px; color:#18181b; line-height:1.4;">
                                                {{ $item['name'] }}
                                                @if(!empty($item['has_individual_discount']))
                                                    <br><span style="font-size:11px; color:#ef4444; font-weight:600; padding-top:4px; display:inline-block;">Dcto. Propio: {{ $item['discount_label'] }}</span>
                                                @endif
                                            </td>
                                            <td align="center" style="padding:12px 10px; border-bottom:1px solid #f4f4f5; font-size:14px; color:#52525b;">
                                                {{ $item['quantity'] }}
                                            </td>
                                            <td align="right" style="padding:12px 10px; border-bottom:1px solid #f4f4f5; font-size:13px; color:#52525b;">
                                                Bs. {{ number_format($item['unit_price'] ?? 0, 2) }}
                                            </td>
                                            <td align="right" style="padding:12px 0 12px 10px; border-bottom:1px solid #f4f4f5; font-size:13px; color:#52525b; font-weight:600;">
                                                Bs. {{ number_format($item['line_subtotal'] ?? 0, 2) }}
                                            </td>
                                        </tr>
                                        @endforeach
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="3" align="right" style="padding:16px 0 8px 0; font-size:13px; color:#52525b;">Subtotal:</td>
                                            <td align="right" style="padding:16px 0 8px 0; font-size:14px; color:#18181b; font-weight:600;">Bs. {{ number_format($subtotal, 2) }}</td>
                                        </tr>
                                        @if($discount > 0)
                                        <tr>
                                            <td colspan="3" align="right" style="padding:8px 0; font-size:13px; color:#ef4444; font-weight:600;">
                                                Descuento Global Prorrateado (@if($discountCode !== 'Ninguno') Cupón: {{ $discountCode }} @else Promoción @endif):
                                            </td>
                                            <td align="right" style="padding:8px 0; font-size:14px; color:#ef4444; font-weight:600;">-Bs. {{ number_format($discount, 2) }}</td>
                                        </tr>
                                        @endif
                                        <tr>
                                            <td colspan="3" align="right" style="padding:16px 0 0 0; border-top:2px solid #e4e4e7; font-size:14px; color:#18181b; font-weight:700;">Tu total a cobrar:</td>
                                            <td align="right" style="padding:16px 0 0 0; border-top:2px solid #e4e4e7; font-size:15px; color:#18181b; font-weight:700;">Bs. {{ number_format($totalAmount, 2) }}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <!-- Botones CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 16px 0;">
                                <tr>
                                    <td align="center" class="btn-td" style="padding: 0;">
                                        <a href="{{ $cartLink }}" class="btn-reset" target="_blank" rel="noopener" style="display:inline-block; background-color:#18181b; color:#ffffff; font-size:14px; font-weight:600; letter-spacing:0.5px; text-decoration:none; padding:14px 40px; border-radius:8px; border:none; box-sizing:border-box; width:100%; text-align:center;">
                                            Ver carrito completo
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 36px 0;">
                                <tr>
                                    <td align="center" class="btn-td" style="padding: 0;">
                                        <a href="{{ $whatsappLink }}" class="btn-reset" target="_blank" rel="noopener" style="display:inline-block; background-color:#25D366; color:#ffffff; font-size:14px; font-weight:600; letter-spacing:0.5px; text-decoration:none; padding:14px 40px; border-radius:8px; border:none; box-sizing:border-box; width:100%; text-align:center;">
                                            Contactar por WhatsApp
                                        </a>
                                    </td>
                                </tr>
                            </table>

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



