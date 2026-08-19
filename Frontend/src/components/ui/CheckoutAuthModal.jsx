import React, { useEffect } from "react";
import { UserCheck, Zap, X } from "lucide-react";

export default function CheckoutAuthModal({ 
  isOpen, 
  onClose, 
  onSelectOption, 
  theme = 'light' 
}) {
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
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
      <div style={{
        backgroundColor: modalBg,
        width: '100%',
        maxWidth: '900px', // Much larger
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' : '0 30px 60px -15px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        animation: 'modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        border: `1px solid ${borderColor}`,
        borderRadius: '24px' // Modern smooth corners
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: isDark ? '#222' : '#f0f0f0',
            border: 'none',
            color: textColor,
            cursor: 'pointer',
            padding: '10px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s, background-color 0.2s',
            zIndex: 10
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.backgroundColor = isDark ? '#333' : '#e0e0e0';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = isDark ? '#222' : '#f0f0f0';
          }}
        >
          <X size={20} />
        </button>

        <div style={{ 
          display: 'flex', 
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          minHeight: '450px' 
        }}>
          
          {/* Option 1: Registered User */}
          <div 
            onClick={() => onSelectOption('user')}
            style={{
              flex: 1,
              padding: '60px 40px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              borderRight: window.innerWidth >= 768 ? `1px solid ${borderColor}` : 'none',
              borderBottom: window.innerWidth < 768 ? `1px solid ${borderColor}` : 'none',
              backgroundColor: modalBg
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = hoverBg}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = modalBg}
          >
            <div style={{
              background: isDark ? '#222' : '#f5f5f5',
              padding: '24px',
              borderRadius: '50%',
              marginBottom: '32px'
            }}>
              <UserCheck size={40} color={textColor} strokeWidth={1.5} />
            </div>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '24px', 
              fontWeight: '400', 
              letterSpacing: '0.05em',
              color: textColor,
              textTransform: 'uppercase'
            }}>
              Tengo una Cuenta
            </h3>
            <p style={{ 
              margin: '0 0 32px 0', 
              fontSize: '15px', 
              color: mutedColor, 
              lineHeight: '1.6',
              maxWidth: '300px'
            }}>
              Inicia sesión o regístrate para gestionar tus pedidos y tener control total sobre tus entregas programadas.
            </p>
            <button style={{
              background: 'transparent',
              color: textColor,
              border: `1px solid ${textColor}`,
              padding: '12px 32px',
              fontSize: '13px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              borderRadius: '0',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = textColor;
              e.currentTarget.style.color = modalBg;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = textColor;
            }}
            >
              Iniciar Sesión
            </button>
          </div>

          {/* Option 2: Guest Checkout */}
          <div 
            onClick={() => onSelectOption('guest')}
            style={{
              flex: 1,
              padding: '60px 40px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              backgroundColor: modalBg
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = hoverBg}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = modalBg}
          >
            <div style={{
              background: isDark ? '#222' : '#f5f5f5',
              padding: '24px',
              borderRadius: '50%',
              marginBottom: '32px'
            }}>
              <Zap size={40} color={textColor} strokeWidth={1.5} />
            </div>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '24px', 
              fontWeight: '400', 
              letterSpacing: '0.05em',
              color: textColor,
              textTransform: 'uppercase'
            }}>
              Compra Rápida
            </h3>
            <p style={{ 
              margin: '0 0 32px 0', 
              fontSize: '15px', 
              color: mutedColor, 
              lineHeight: '1.6',
              maxWidth: '300px'
            }}>
              Continúa como invitado. Entregas de productos con limitantes y con previa confirmación manual.
            </p>
            <button style={{
              background: textColor,
              color: modalBg,
              border: `1px solid ${textColor}`,
              padding: '12px 32px',
              fontSize: '13px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              borderRadius: '0',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = textColor;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = textColor;
              e.currentTarget.style.color = modalBg;
            }}
            >
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
      `}</style>
    </div>
  );
}
