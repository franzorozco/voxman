import React, { useRef } from 'react';
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import './Promotions.css';

export default function PromotionCoupon({ promotion, onClose }) {
  const couponRef = useRef(null);

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
      link.download = `cupon-${promotion.code || promotion.name}.png`;
      link.click();
    } catch (error) {
      console.error('Error generando imagen:', error);
    }
  };

  // Determine validity
  const validUntil = promotion.end_date 
    ? new Date(promotion.end_date).toLocaleDateString() 
    : 'Sin caducidad';

  // Value formatting
  const discountText = promotion.type === 'percentage' 
    ? `${promotion.value}% OFF` 
    : `${promotion.value} Bs OFF`;

  return (
    <div className="promo-coupon-overlay">
      <div className="promo-coupon-content">
        <button onClick={onClose} className="promo-coupon-close">
          <X size={24} />
        </button>

        <h2 className="promo-coupon-title">Generar Ticket (PNG)</h2>

        {/* CONTENEDOR DEL CUPÓN (Lo que se va a imprimir) */}
        <div 
          ref={couponRef}
          className="promo-coupon-print-area"
        >
          {/* Decorative circles */}
          <div className="promo-coupon-circle left"></div>
          <div className="promo-coupon-circle right"></div>

          <img 
            src="/src/assets/global/logo_sinfondo.png" 
            alt="Logo" 
            className="promo-coupon-logo"
          />
          
          <div className="promo-coupon-header">
            <h3 className="promo-coupon-discount">
              {discountText}
            </h3>
            <p className="promo-coupon-name">{promotion.name}</p>
          </div>

          <div className="promo-coupon-qr">
            <QRCodeSVG 
              value={promotion.code || promotion.name} 
              size={120} 
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"M"}
            />
          </div>

          {promotion.code && (
            <div className="promo-coupon-code-box">
              {promotion.code}
            </div>
          )}

          <div className="promo-coupon-footer">
            Válido hasta: <strong>{validUntil}</strong>
          </div>
        </div>

        <button 
          className="btn-primary promo-coupon-print-btn" 
          onClick={handleDownload}
        >
          <Download size={20} />
          Imprimir en PNG
        </button>
      </div>
    </div>
  );
}
