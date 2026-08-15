import React, { useRef } from 'react';
import { API_BASE_URL } from "../../../../config/api";
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

export default function GiftcardCoupon({ isOpen, giftcard, onClose }) {
  const couponRef = useRef(null);

  if (!isOpen || !giftcard) return null;

  const handleDownload = async () => {
    if (!couponRef.current) return;
    try {
      const canvas = await html2canvas(couponRef.current, {
        backgroundColor: '#000000',
        scale: 3, // High resolution
        useCORS: true,
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `giftcard-${giftcard.code}.png`;
      link.click();
    } catch (error) {
      console.error('Error generando imagen:', error);
    }
  };

  const validUntil = giftcard.expires_at 
    ? new Date(giftcard.expires_at).toLocaleDateString() 
    : 'Sin caducidad';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
      <div className="modal-content" style={{ background: 'var(--bg-main)', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-main)' }}>Generar Ticket (PNG)</h2>

        {/* CONTENEDOR DEL CUPÓN (Lo que se va a imprimir) */}
        <div 
          ref={couponRef}
          style={{
            background: '#0a0a0a',
            borderRadius: '20px',
            padding: '30px',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '2px dashed #333',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            marginBottom: '24px'
          }}
        >
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-main)' }}></div>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-main)' }}></div>

          <img 
            src={`${API_BASE_URL}/storage/system/logos/logo_black_sinfondo.png`} 
            alt="Logo" 
            style={{ height: '60px', objectFit: 'contain', marginBottom: '20px' }}
          />
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              GIFTCARD
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#aaaaaa' }}>Saldo Actual</p>
            <h2 style={{ fontSize: '32px', margin: '5px 0', color: 'var(--primary-color)' }}>
              {formatCurrency(giftcard.current_balance)}
            </h2>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '10px', 
            borderRadius: '10px',
            marginBottom: '15px'
          }}>
            <QRCodeSVG 
              value={giftcard.code} 
              size={120} 
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"M"}
            />
          </div>

          <div style={{ 
            background: '#222', 
            padding: '8px 20px', 
            borderRadius: '8px', 
            fontSize: '18px', 
            fontWeight: 'bold', 
            letterSpacing: '3px',
            marginBottom: '15px'
          }}>
            {giftcard.code}
          </div>

          <div style={{ fontSize: '12px', color: '#888', textAlign: 'center', borderTop: '1px dashed #444', paddingTop: '15px', width: '100%' }}>
            Válido hasta: <strong style={{ color: '#fff' }}>{validUntil}</strong>
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleDownload}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '10px' }}
        >
          <Download size={20} />
          Imprimir en PNG
        </button>
      </div>
    </div>
  );
}
