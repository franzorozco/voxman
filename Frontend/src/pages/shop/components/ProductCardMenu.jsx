import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Heart } from 'lucide-react';
import useShopWishlistStore from '../../../store/shop/useShopWishlistStore';
import { useAuthStore } from '../../../store/authStore';

const ProductCardMenu = ({ productId, variantId = null, className = '', style = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const { toggleWishlist } = useShopWishlistStore();
  const auth = useAuthStore();

  const activeUser = auth.user;
  const isAuthenticated = !!auth.token;

  // Si no es un usuario autenticado con perfil, no renderizar o deshabilitar
  const isCustomer = isAuthenticated && activeUser?.customers && activeUser.customers.length > 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isCustomer) {
      alert('Debes iniciar sesión como cliente para usar la lista de deseos.');
      setIsOpen(false);
      return;
    }
    toggleWishlist(productId, variantId);
    alert('Agregado a tu lista de deseos');
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', zIndex: 50, ...style }} className={className}>
      <button
        onClick={handleToggle}
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--border-color, #e5e5e5)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-main, #111)',
          transition: 'all 0.2s ease',
        }}
        title="Opciones"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '36px',
          right: '0',
          background: '#fff',
          border: '1px solid var(--border-color, #e5e5e5)',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          minWidth: '160px',
          padding: '4px 0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 60
        }}>
          <button
            onClick={handleWishlistClick}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: 'var(--text-main, #111)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Heart size={16} fill="none" color="currentColor" />
            Agregar a deseos
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCardMenu;
