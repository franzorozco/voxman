import React, { useEffect } from "react";
import { AlertTriangle, Info, Trash2, CheckCircle } from "lucide-react";
import "./ConfirmModal.css";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  message = "¿Estás seguro de realizar esta acción?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger", // 'danger' | 'warning' | 'success' | 'info'
  theme, // 'light' | 'dark' | undefined
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

  // Determine icon based on type
  let Icon = Info;
  switch (type) {
    case "danger":
      Icon = Trash2;
      break;
    case "warning":
      Icon = AlertTriangle;
      break;
    case "success":
      Icon = CheckCircle;
      break;
    case "info":
    default:
      Icon = Info;
      break;
  }

  const themeBackdropClass = theme ? `confirm-theme-${theme}` : "";
  const themeCardClass = theme ? `confirm-card-${theme}` : "";

  return (
    <div 
      className={`confirm-modal-backdrop ${themeBackdropClass}`}
      onClick={onClose} // close if clicking outside
    >
      <div 
        className={`confirm-modal-card ${themeCardClass}`}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="confirm-modal-body">
          <div className={`confirm-modal-icon-wrapper ${type}`}>
            <Icon size={26} />
          </div>

          <h3 id="confirm-modal-title" className="confirm-modal-title">
            {title}
          </h3>
          
          <p className="confirm-modal-message">
            {message}
          </p>
        </div>

        <div className="confirm-modal-footer">
          <button 
            type="button"
            onClick={onClose}
            className="confirm-modal-btn confirm-modal-btn-cancel"
          >
            {cancelText}
          </button>
          
          <button 
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`confirm-modal-btn confirm-modal-btn-confirm ${type}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
