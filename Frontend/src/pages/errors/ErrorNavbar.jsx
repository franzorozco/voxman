import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUtils";
import { useShopSettingsStore } from "../../store/shop/useShopSettingsStore";

export default function ErrorNavbar() {
  const { settings, fetchSettings } = useShopSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Como la página de error siempre es blanca, forzamos el uso del logo oscuro (para contrastar en fondo blanco)
  const logoUrl = settings?.store_logo_dark 
    ? getImageUrl(settings.store_logo_dark) 
    : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/lodo_default_for_white.png';

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '70px',
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 5%',
      fontFamily: '"Poppins", sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/">
          <img 
            src={logoUrl} 
            alt={settings?.store_name || "VOXman"} 
            style={{ maxHeight: '36px', objectFit: 'contain', display: 'block' }} 
          />
        </Link>
      </div>

      <div>
        <Link 
          to="/"
          style={{
            textDecoration: 'none',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            padding: '10px 24px',
            borderRadius: '999px',
            background: '#000000',
            transition: 'all 0.3s ease',
            display: 'inline-block'
          }}
          onMouseOver={(e) => { 
            e.target.style.transform = 'translateY(-2px)'; 
            e.target.style.boxShadow = '0 6px 15px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => { 
            e.target.style.transform = 'translateY(0)'; 
            e.target.style.boxShadow = 'none';
          }}
        >
          Ir al inicio
        </Link>
      </div>
    </header>
  );
}
