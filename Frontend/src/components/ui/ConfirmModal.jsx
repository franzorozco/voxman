import React, { useEffect } from "react";
import { AlertTriangle, Info, Trash2, CheckCircle } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  message = "¿Estás seguro de realizar esta acción?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger", // 'danger' | 'warning' | 'success' | 'info'
}) {
  
  // Close on Escape key
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

  // Determine icon and colors based on type
  let Icon = Info;
  let confirmBgColor = "var(--color-primary)";
  let confirmTextColor = "var(--color-primary-text)";
  let iconColor = "var(--text-main)";

  switch (type) {
    case "danger":
      Icon = Trash2;
      confirmBgColor = "rgba(239, 68, 68, 0.15)";
      confirmTextColor = "var(--color-danger)";
      iconColor = "var(--color-danger)";
      break;
    case "warning":
      Icon = AlertTriangle;
      confirmBgColor = "rgba(245, 158, 11, 0.15)";
      confirmTextColor = "var(--color-warning)";
      iconColor = "var(--color-warning)";
      break;
    case "success":
      Icon = CheckCircle;
      confirmBgColor = "rgba(16, 185, 129, 0.15)";
      confirmTextColor = "var(--color-success)";
      iconColor = "var(--color-success)";
      break;
    case "info":
    default:
      Icon = Info;
      confirmBgColor = "var(--bg-overlay)";
      confirmTextColor = "var(--text-main)";
      iconColor = "var(--color-primary)";
      break;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999, // Ensure it's above everything else
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose} // close if clicking outside
    >
      <div 
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '400px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-color)',
          transform: 'scale(1)',
          animation: 'slideUp 0.2s ease'
        }}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
      >
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            background: confirmBgColor, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Icon size={24} color={iconColor} />
          </div>

          <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', color: 'var(--text-main)' }}>
            {title}
          </h3>
          
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>

        <div style={{ 
          padding: '16px 24px', 
          background: 'var(--bg-main)', 
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontWeight: '500',
              cursor: 'pointer',
              flex: 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-overlay)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
          >
            {cancelText}
          </button>
          
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid ' + iconColor,
              background: confirmBgColor,
              color: confirmTextColor,
              fontWeight: '600',
              cursor: 'pointer',
              flex: 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
            onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
