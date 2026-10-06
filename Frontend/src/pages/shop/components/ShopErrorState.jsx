import React from 'react';
import './ShopErrorState.css';

const ShopErrorState = ({ 
  title = "Algo salió mal", 
  message = "No pudimos cargar la información en este momento. Por favor, intenta de nuevo más tarde.",
  onRetry 
}) => {
  return (
    <div className="shop-error-container">
      <div className="shop-error-content">
        <div className="shop-error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="shop-error-title">{title}</h2>
        <p className="shop-error-message">{message}</p>
        {onRetry && (
          <button className="shop-error-retry-btn" onClick={onRetry}>
            Intentar de nuevo
          </button>
        )}
      </div>
    </div>
  );
};

export default ShopErrorState;
