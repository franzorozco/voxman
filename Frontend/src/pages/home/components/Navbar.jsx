import { getImageUrl } from '../../../utils/imageUtils';
import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { User, LayoutDashboard, Store, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from "../../../store/authStore";
import { useThemeStore } from "../../../store/themeStore";
import { useShopSettingsStore } from "../../../store/shop/useShopSettingsStore";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import "./Navbar.css";

export default function Navbar({ logo: _propLogo, isDarkThemeOverride }) {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { isDark: globalIsDark } = useThemeStore();
  const { settings, fetchSettings } = useShopSettingsStore();

  // Si está dentro de Profile, usa isDarkThemeOverride. En Home/Páginas públicas, siempre es oscuro (true).
  const isDarkContext = isDarkThemeOverride !== undefined ? isDarkThemeOverride : true;

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isOwner = user?.roles?.includes("Owner");
  
  // El botón "Administración" solo aparece si el usuario puede entrar al panel (access_dashboard)
  // Y tiene al menos un permiso de alguna vista del dashboard (view_* o manage_*).
  // Tener solo el rol "Administrador" ya no basta: lo que cuenta son los permisos asignados.
  const perms = user?.permissions ?? [];
  const hasDashboardAccess = isOwner || (
    perms.includes('access_dashboard') &&
    perms.some(p => p.startsWith('view_') || p.startsWith('manage_'))
  );

  // Verificamos si tiene alguno de los permisos de ventas para entrar al Punto de Venta
  const hasPosAccess = user?.permissions?.includes("sell_own_branch") || user?.permissions?.includes("sell_all_branches");

  const menuRef = useRef();

  const getInitials = (username) => {
    if (!username) return "?";
    return username.slice(0, 2).toUpperCase();
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

  // Ajustamos la lógica para mostrar el logo que contraste correctamente con el fondo
  const logoUrl = isDarkContext 
    ? (settings.store_logo_dark ? getImageUrl(settings.store_logo_dark) : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/lodo_default_for_black.png') 
    : (settings.store_logo_light ? getImageUrl(settings.store_logo_light) : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/lodo_default_for_white.png');

  return (
    <>
      <header className="nav-header">

      <div className="nav-container">

        {/* LOGO */}
        <div className="nav-logo">
          <Link to="/" onClick={closeMenu}>
            <img src={logoUrl} alt={settings.store_name || "VOXman"} style={{ maxHeight: '36px', objectFit: 'contain' }} />
          </Link>
        </div>

        {/* OVERLAY MÓVIL */}
        {menuOpen && (
          <div className="nav-mobile-overlay" onClick={() => setMenuOpen(false)} />
        )}

        {/* MENU ÚNICO */}
        <nav className={`nav-menu ${menuOpen ? "active" : ""}`}>

          <NavLink to="/" end onClick={closeMenu}>Inicio</NavLink>
          <NavLink to="/shop" onClick={closeMenu}>
            {settings.store_name ? `Tienda ${settings.store_name}` : "Tienda"}
          </NavLink>
          <NavLink to="/entregas" onClick={closeMenu}>
            Envíos y Entregas
          </NavLink>
          <NavLink to="/nosotros" onClick={closeMenu}>
            Nosotros
          </NavLink>

          {!user && (
            <div className="nav-mobile-auth">

              <Link
                to="/login"
                className="nav-btn nav-btn-outline"
                onClick={closeMenu}
              >
                Iniciar sesión
              </Link>

              <Link
                to="/register"
                className="nav-btn nav-btn-solid"
                onClick={closeMenu}
              >
                Registrarse
              </Link>

            </div>
          )}

        </nav>

        {/* ACCIONES */}
        <div className="nav-actions">

          {!user ? (
            <>
              <div className="nav-desktop-auth">

                <Link
                  to="/login"
                  className="nav-btn nav-btn-outline"
                >
                  Iniciar sesión
                </Link>

                <Link
                  to="/register"
                  className="nav-btn nav-btn-solid"
                >
                  Registrarse
                </Link>

              </div>
              <div className="nav-mobile-auth-icon">
                <Link to="/login" style={{ display: 'flex', alignItems: 'center' }}>
                  <User size={24} color={isDarkContext ? "#fff" : "#000"} strokeWidth={1.5} />
                </Link>
              </div>
            </>
          ) : (
            <div className="nav-user" ref={menuRef}>

              <button 
                type="button"
                className="nav-avatar-btn"
                onClick={() => setOpen(!open)}
                aria-label="Menú de usuario"
                aria-expanded={open}
              >
                {user.photo ? (
                  <img src={user.photo} className="nav-avatar" alt="Avatar" />
                ) : (
                  <div className="nav-avatar-fallback">
                    {getInitials(user.name || user.username)}
                  </div>
                )}
              </button>

              {open && (
                <div className="nav-dropdown" role="menu">
                  {/* CABECERA CON DATOS DEL USUARIO */}
                  <div className="nav-dropdown-header">
                    <div className="nav-dropdown-avatar-sm">
                      {user.photo ? (
                        <img src={user.photo} alt="Avatar" />
                      ) : (
                        <span>{getInitials(user.name || user.username)}</span>
                      )}
                    </div>
                    <div className="nav-dropdown-user-details">
                      <span className="nav-dropdown-name">
                        {user.name || user.username || "Mi Cuenta"}
                      </span>
                      <span className="nav-dropdown-email">
                        {user.email || "Usuario autenticado"}
                      </span>
                    </div>
                  </div>

                  <div className="nav-dropdown-divider" />

                  {/* ELEMENTOS DEL MENÚ */}
                  <div className="nav-dropdown-menu">
                    <Link 
                      to="/profile" 
                      state={{ theme: isDarkContext ? 'dark' : 'light' }}
                      className="nav-dropdown-item"
                      onClick={() => setOpen(false)}
                      role="menuitem"
                    >
                      <span className="nav-dropdown-icon">
                        <User size={16} />
                      </span>
                      <span className="nav-dropdown-text">Ver perfil</span>
                      <ChevronRight size={14} className="nav-dropdown-arrow" />
                    </Link>

                    {hasDashboardAccess && (
                      <Link 
                        to="/dashboard"
                        className="nav-dropdown-item"
                        onClick={() => setOpen(false)}
                        role="menuitem"
                      >
                        <span className="nav-dropdown-icon">
                          <LayoutDashboard size={16} />
                        </span>
                        <span className="nav-dropdown-text">Administración</span>
                        <ChevronRight size={14} className="nav-dropdown-arrow" />
                      </Link>
                    )}
                    
                    {hasPosAccess && (
                      <Link 
                        to="/pos"
                        className="nav-dropdown-item"
                        onClick={() => setOpen(false)}
                        role="menuitem"
                      >
                        <span className="nav-dropdown-icon">
                          <Store size={16} />
                        </span>
                        <span className="nav-dropdown-text">Punto de venta</span>
                        <ChevronRight size={14} className="nav-dropdown-arrow" />
                      </Link>
                    )}
                  </div>

                  <div className="nav-dropdown-divider" />

                  {/* CERRAR SESIÓN */}
                  <button 
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleLogoutClick();
                    }}
                    className="nav-dropdown-item nav-dropdown-item-logout"
                    role="menuitem"
                  >
                    <span className="nav-dropdown-icon nav-dropdown-icon-danger">
                      <LogOut size={16} />
                    </span>
                    <span className="nav-dropdown-text">Cerrar sesión</span>
                  </button>

                </div>
              )}

            </div>
          )}

          {/* HAMBURGUESA */}
          <div
            className={`hamburger ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

        </div>

      </div>

    </header>
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
    </>
  );
}
