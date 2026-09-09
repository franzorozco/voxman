import { getImageUrl } from '../../../../utils/imageUtils';
import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../../../../store/authStore";
import useShopCartStore from "../../../../store/shop/useShopCartStore";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";
import { useThemeStore } from "../../../../store/themeStore";
import { API_BASE_URL } from "../../../../config/api";
import Footer from "../../../../components/layout/Footer";
import './ShopLayout.css';

const ShopNavbar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const cartItems = useShopCartStore((state) => state.items);
  const { isDark } = useThemeStore();
  const { settings, fetchSettings } = useShopSettingsStore();

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bounce, setBounce] = useState(false);
  const menuRef = useRef();
  const prevCountRef = useRef(0);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    setMenuOpen(false);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    if (cartItemCount > prevCountRef.current) {
      setBounce(true);
      setTimeout(() => setBounce(false), 300);
    }
    prevCountRef.current = cartItemCount;
  }, [cartItemCount]);

  // Como shopTheme es siempre claro, usamos el logo oscuro por defecto (para contraste en fondo blanco)
  const logoUrl = settings.store_logo_light 
    ? getImageUrl(settings.store_logo_light) 
    : getImageUrl('/system/logos/logo_black_sinfondo.png');

  return (
    <header className="shop-nav-header">
      <div className="shop-nav-container">
        {/* LOGO */}
        <div className="shop-nav-logo">
          <Link to="/" onClick={closeMenu}>
            <img src={logoUrl} alt={settings.store_name || "VOXman"} style={{ height: '36px', display: 'block', objectFit: 'contain' }} />
          </Link>
        </div>

        {/* MENU ÚNICO */}
        <nav className={`shop-nav-menu ${menuOpen ? "active" : ""}`}>
          <NavLink to="/shop" end onClick={closeMenu}>Tienda</NavLink>
          <NavLink to="/shop/catalog" onClick={closeMenu}>Catálogo</NavLink>
          {/* <NavLink to="/shop/collections" onClick={closeMenu}>Colecciones</NavLink> */}

          {!user ? (
            <div className="shop-nav-mobile-auth">
              <Link to="/shop/login" className="shop-nav-btn shop-nav-btn-outline" onClick={closeMenu}>Iniciar sesión</Link>
              <Link to="/shop/register" className="shop-nav-btn shop-nav-btn-solid" onClick={closeMenu}>Registrarse</Link>
            </div>
          ) : (
            <div className="shop-nav-mobile-user">
              <Link to="/profile" state={{ theme: 'light' }} onClick={closeMenu}>Ver perfil</Link>
              <Link to="/shop/orders" onClick={closeMenu}>Mis pedidos</Link>
              <button onClick={handleLogout}>Cerrar sesión</button>
            </div>
          )}
        </nav>

        {/* ACCIONES */}
        <div className="shop-nav-actions">
          
          <Link to="/shop/cart" className="shop-nav-cart-btn" onClick={closeMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartItemCount > 0 && <span className={`cart-badge ${bounce ? 'bounce' : ''}`}>{cartItemCount}</span>}
          </Link>

          {!user ? (
            <div className="shop-nav-desktop-auth">
              <Link to="/shop/login" className="shop-nav-btn shop-nav-btn-outline">Iniciar sesión</Link>
              <Link to="/shop/register" className="shop-nav-btn shop-nav-btn-solid">Registrarse</Link>
            </div>
          ) : (
            <div className="shop-nav-user" ref={menuRef}>
              <div onClick={() => setOpen(!open)}>
                {user.photo ? (
                  <img src={user.photo} className="shop-nav-avatar" alt="Avatar" />
                ) : (
                  <div className="shop-nav-avatar-fallback">{getInitials(user.name || user.email)}</div>
                )}
              </div>

              {open && (
                <div className="shop-nav-dropdown">
                  <Link to="/profile" state={{ theme: 'light' }}>Ver perfil</Link>
                  <div className="shop-divider" />
                  <button onClick={handleLogout}>Cerrar sesión</button>
                </div>
              )}
            </div>
          )}

          {/* HAMBURGUESA */}
          <div className={`shop-hamburger ${menuOpen ? "active" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </header>
  );
};

const ShopLayout = () => {
  return (
    <div className="shop-layout-wrapper">
      <ShopNavbar />
      <main className="shop-main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default ShopLayout;

