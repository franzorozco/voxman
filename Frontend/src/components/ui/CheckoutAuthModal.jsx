import React, { useEffect } from 'react';
import { X, UserCheck, Zap } from 'lucide-react';

export default function CheckoutAuthModal({ isOpen, onClose, onSelectOption, theme = 'light' }) {
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const overlayBg = isDark ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.85)";
  const modalBg = isDark ? "#111" : "#fff";
  const textColor = isDark ? "#fff" : "#111";
  const mutedColor = isDark ? "#888" : "#666";
  const borderColor = isDark ? "#333" : "#eaeaea";
  const hoverBg = isDark ? "#1a1a1a" : "#f9f9f9";
  const iconBg = isDark ? '#222' : '#f5f5f5';
  
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: overlayBg,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="auth-modal-wrapper" style={{
        backgroundColor: modalBg,
        width: '100%',
        maxWidth: '900px',
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' : '0 30px 60px -15px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        animation: 'modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        border: `1px solid ${borderColor}`,
        borderRadius: '0px'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="auth-modal-close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: textColor,
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            zIndex: 10
          }}
        >
          <X size={24} strokeWidth={1.5} />
        </button>

        <div className="auth-modal-content">
          
          {/* Option 1: Registered User */}
          <div 
            className="auth-option auth-option-left"
            onClick={() => onSelectOption('user')}
            style={{ backgroundColor: modalBg }}
          >
            <div className="auth-icon-wrap" style={{ background: iconBg }}>
              <UserCheck size={32} color={textColor} strokeWidth={1.5} />
            </div>
            <h3 style={{ color: textColor }}>
              Tengo Cuenta
            </h3>
            <p style={{ color: mutedColor }}>
              Inicia sesión o regístrate para gestionar tus pedidos y tener control sobre tus entregas.
            </p>
            <button className="auth-btn-outline" style={{ color: textColor, borderColor: textColor }}>
              Iniciar Sesión
            </button>
          </div>

          {/* Option 2: Guest Checkout */}
          <div 
            className="auth-option auth-option-right"
            onClick={() => onSelectOption('guest')}
            style={{ backgroundColor: modalBg }}
          >
            <div className="auth-icon-wrap" style={{ background: iconBg }}>
              <Zap size={32} color={textColor} strokeWidth={1.5} />
            </div>
            <h3 style={{ color: textColor }}>
              Compra Rápida
            </h3>
            <p style={{ color: mutedColor }}>
              Continúa como invitado. Entregas de productos con limitantes y previa confirmación manual.
            </p>
            <button className="auth-btn-solid" style={{ background: textColor, color: modalBg, borderColor: textColor }}>
              Continuar como Invitado
            </button>
          </div>

        </div>
      </div>
      
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .auth-modal-content {
          display: flex;
          flex-direction: column;
          min-height: auto;
          max-height: 80vh;
          overflow-y: auto;
        }

        .auth-option {
          flex: 1;
          padding: 40px 20px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .auth-option-left {
          border-bottom: 1px solid ${borderColor};
        }

        .auth-option:hover {
          background-color: ${hoverBg} !important;
        }

        .auth-icon-wrap {
          padding: 20px;
          border-radius: 50%;
          margin-bottom: 20px;
        }

        .auth-option h3 {
          margin: 0 0 12px 0;
          font-size: 20px;
          font-weight: 400;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .auth-option p {
          margin: 0 0 24px 0;
          font-size: 13px;
          line-height: 1.5;
          max-width: 280px;
        }

        .auth-option button {
          padding: 12px 24px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 0;
          cursor: pointer;
          transition: all 0.3s ease;
          background: transparent;
          border-style: solid;
          border-width: 1px;
        }

        .auth-btn-outline:hover {
          background: ${textColor} !important;
          color: ${modalBg} !important;
        }

        .auth-btn-solid:hover {
          background: transparent !important;
          color: ${textColor} !important;
        }

        .auth-modal-close:hover {
          transform: scale(1.1);
        }

        /* Desktop Layout */
        @media (min-width: 768px) {
          .auth-modal-content {
            flex-direction: row;
            min-height: 450px;
            overflow-y: visible;
          }
          .auth-option {
            padding: 60px 40px;
          }
          .auth-option-left {
            border-bottom: none;
            border-right: 1px solid ${borderColor};
          }
          .auth-icon-wrap {
            padding: 24px;
            margin-bottom: 32px;
          }
          .auth-option h3 {
            font-size: 24px;
            margin-bottom: 16px;
          }
          .auth-option p {
            font-size: 15px;
            margin-bottom: 32px;
            max-width: 300px;
          }
          .auth-option button {
            padding: 12px 32px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}
