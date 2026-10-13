import { getImageUrl } from '../../../../utils/imageUtils';
import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../store/authStore";
import useShopCartStore from "../../../../store/shop/useShopCartStore";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";
import { useThemeStore } from "../../../../store/themeStore";
import { API_BASE_URL } from "../../../../config/api";
import Footer from "../../../../components/layout/Footer";
import CheckoutLoginModal from "../../../../components/ui/CheckoutLoginModal";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import { User, Package, LogOut, LayoutDashboard, Store, ChevronRight } from 'lucide-react';
import './ShopLayout.css';

const ShopNavbar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const cartItems = useShopCartStore((state) => state.items);
  const { isDark } = useThemeStore();
  const { settings, fetchSettings } = useShopSettingsStore();

  const isOwner = user?.roles?.includes("Owner");
  const perms = user?.permissions ?? [];
  const hasDashboardAccess = isOwner || (
    perms.includes('access_dashboard') &&
    perms.some(p => p.startsWith('view_') || p.startsWith('manage_'))
  );
  const hasPosAccess = isOwner || user?.permissions?.includes("sell_own_branch") || user?.permissions?.includes("sell_all_branches");

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const [bounce, setBounce] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('login');
  const [modalInitialData, setModalInitialData] = useState(null);
  
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("google_reg_token");
    const email = params.get("email");
    const name = params.get("name") || "";

    if (token) {
      setModalMode('google_register');
      setModalInitialData({ googleRegToken: token, email, name });
      setIsLoginModalOpen(true);
      // Clean url to avoid infinite loops?
      // window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);
  
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
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const executeLogout = () => {
    logout();
    setOpen(false);
    setMenuOpen(false);
    setIsLogoutModalOpen(false);
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
    : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/lodo_default_for_white.png';

  return (
    <header className="shop-nav-header">
      <div className="shop-nav-container">
        {/* LOGO */}
        <div className="shop-nav-logo">
          <Link to="/" onClick={closeMenu}>
            <img src={logoUrl} alt={settings.store_name || "VOXman"} style={{ height: '36px', display: 'block', objectFit: 'contain' }} />
          </Link>
        </div>

        {/* OVERLAY MÓVIL */}
        {menuOpen && (
          <div className="shop-nav-mobile-overlay" onClick={() => setMenuOpen(false)} />
        )}

        {/* MENU ÚNICO */}
        <nav className={`shop-nav-menu ${menuOpen ? "active" : ""}`}>
          {user && (
            <div className="shop-nav-mobile-user">
              <div className="shop-nav-mobile-user-card">
                <div className="shop-nav-avatar-wrapper">
                  {user.photo ? (
                    <img src={user.photo} className="shop-nav-avatar" alt="Avatar" />
                  ) : (
                    <div className="shop-nav-avatar-fallback">{getInitials(user.name || user.email || user.username)}</div>
                  )}
                </div>
                <div className="shop-nav-mobile-user-info">
                  <span className="shop-nav-mobile-username">{user.name || user.username || user.email}</span>
                  <Link to="/profile" state={{ theme: 'light' }} onClick={closeMenu} className="shop-nav-mobile-view-profile">
                    Gestionar cuenta
                  </Link>
                </div>
              </div>
              <div className="shop-nav-mobile-user-links">
                <Link to="/shop/orders" onClick={closeMenu}>
                  Mis pedidos
                </Link>
                <button onClick={handleLogoutClick} className="shop-nav-mobile-logout">
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

          <NavLink to="/shop" end onClick={closeMenu}>Tienda</NavLink>
          <NavLink to="/shop/catalog" onClick={closeMenu}>Catálogo</NavLink>
          {/* <NavLink to="/shop/collections" onClick={closeMenu}>Colecciones</NavLink> */}

          {!user && (
            <div className="shop-nav-mobile-auth">
              <button className="shop-nav-btn shop-nav-btn-outline" onClick={() => { closeMenu(); setModalMode('login'); setIsLoginModalOpen(true); }}>Iniciar sesión</button>
              <button className="shop-nav-btn shop-nav-btn-solid" onClick={() => { closeMenu(); setModalMode('register'); setIsLoginModalOpen(true); }}>Registrarse</button>
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
              <button className="shop-nav-btn shop-nav-btn-outline" onClick={() => { setModalMode('login'); setIsLoginModalOpen(true); }}>Iniciar sesión</button>
              <button className="shop-nav-btn shop-nav-btn-solid" onClick={() => { setModalMode('register'); setIsLoginModalOpen(true); }}>Registrarse</button>
            </div>
          ) : (
            <div className="shop-nav-user" ref={menuRef}>
              <button 
                type="button"
                className="shop-nav-avatar-btn"
                onClick={() => setOpen(!open)}
                aria-label="Menú de usuario"
                aria-expanded={open}
              >
                {user.photo ? (
                  <img src={user.photo} className="shop-nav-avatar" alt="Avatar" />
                ) : (
                  <div className="shop-nav-avatar-fallback">{getInitials(user.name || user.email)}</div>
                )}
              </button>

              {open && (
                <div className="shop-nav-dropdown" role="menu">
                  {/* CABECERA CON DATOS DEL USUARIO */}
                  <div className="shop-nav-dropdown-header">
                    <div className="shop-nav-dropdown-avatar-sm">
                      {user.photo ? (
                        <img src={user.photo} alt="Avatar" />
                      ) : (
                        <span>{getInitials(user.name || user.email)}</span>
                      )}
                    </div>
                    <div className="shop-nav-dropdown-user-details">
                      <span className="shop-nav-dropdown-name">
                        {user.name || user.username || "Mi Cuenta"}
                      </span>
                      <span className="shop-nav-dropdown-email">
                        {user.email || "Usuario autenticado"}
                      </span>
                    </div>
                  </div>

                  <div className="shop-nav-dropdown-divider" />

                  {/* ELEMENTOS DEL MENÚ */}
                  <div className="shop-nav-dropdown-menu">
                    <Link 
                      to="/profile" 
                      state={{ theme: 'light' }}
                      className="shop-nav-dropdown-item"
                      onClick={() => setOpen(false)}
                      role="menuitem"
                    >
                      <span className="shop-nav-dropdown-icon">
                        <User size={16} />
                      </span>
                      <span className="shop-nav-dropdown-text">Ver perfil</span>
                      <ChevronRight size={14} className="shop-nav-dropdown-arrow" />
                    </Link>

                    {hasDashboardAccess && (
                      <Link 
                        to="/dashboard"
                        className="shop-nav-dropdown-item"
                        onClick={() => setOpen(false)}
                        role="menuitem"
                      >
                        <span className="shop-nav-dropdown-icon">
                          <LayoutDashboard size={16} />
                        </span>
                        <span className="shop-nav-dropdown-text">Administración</span>
                        <ChevronRight size={14} className="shop-nav-dropdown-arrow" />
                      </Link>
                    )}
                    
                    {hasPosAccess && (
                      <Link 
                        to="/pos"
                        className="shop-nav-dropdown-item"
                        onClick={() => setOpen(false)}
                        role="menuitem"
                      >
                        <span className="shop-nav-dropdown-icon">
                          <Store size={16} />
                        </span>
                        <span className="shop-nav-dropdown-text">Punto de venta</span>
                        <ChevronRight size={14} className="shop-nav-dropdown-arrow" />
                      </Link>
                    )}
                  </div>

                  <div className="shop-nav-dropdown-divider" />

                  {/* CERRAR SESIÓN */}
                  <button 
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleLogoutClick();
                    }}
                    className="shop-nav-dropdown-item shop-nav-dropdown-item-logout"
                    role="menuitem"
                  >
                    <span className="shop-nav-dropdown-icon shop-nav-dropdown-icon-danger">
                      <LogOut size={16} />
                    </span>
                    <span className="shop-nav-dropdown-text">Cerrar sesión</span>
                  </button>
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

      <CheckoutLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        initialMode={modalMode}
        initialData={modalInitialData}
        theme="light" // El shop es siempre claro
      />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={executeLogout}
        title="Cerrar sesión"
        message="¿Estás seguro de que deseas cerrar sesión?"
        confirmText="Sí, salir"
        cancelText="Cancelar"
        type="warning"
      />
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

