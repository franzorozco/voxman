import { getImageUrl } from '../../utils/imageUtils';
import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { useShopSettingsStore } from "../../store/shop/useShopSettingsStore";
import "./Navbar.css";

export default function Navbar({ logo: _propLogo }) {

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { isDark } = useThemeStore();
  const { settings, fetchSettings } = useShopSettingsStore();

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.roles?.includes("Administrador");
  
  // Verificamos si tiene cualquier permiso administrativo o el rol Administrador para entrar al Dashboard
  const hasDashboardAccess = isAdmin || user?.permissions?.some(p => 
    p.startsWith('view_') || p.startsWith('manage_') || p.startsWith('create_') || p.startsWith('edit_')
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };

  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    setMenuOpen(false);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Invertimos la lógica para que muestre "el otro" logo en la página principal, según lo solicitado.
  const logoUrl = isDark 
    ? (settings.store_logo_light ? getImageUrl(settings.store_logo_light) : getImageUrl('/system/logos/logo_black_sinfondo.png')) 
    : (settings.store_logo_dark ? getImageUrl(settings.store_logo_dark) : getImageUrl('/system/logos/logo_white_sinfondo.png'));

  return (
    <header className="nav-header">

      <div className="nav-container">

        {/* LOGO */}
        <div className="nav-logo">
          <Link to="/" onClick={closeMenu}>
            <img src={logoUrl} alt={settings.store_name || "VOXman"} style={{ maxHeight: '36px', objectFit: 'contain' }} />
          </Link>
        </div>

        {/* MENU ÚNICO */}
        <nav className={`nav-menu ${menuOpen ? "active" : ""}`}>

          <NavLink to="/" end onClick={closeMenu}>Inicio</NavLink>

          <NavLink to="/shop" onClick={closeMenu}>
            Tienda
          </NavLink>

          <NavLink to="/collections" onClick={closeMenu}>
            Colecciones
          </NavLink>

          <NavLink to="/nosotros" onClick={closeMenu}>
            Nosotros
          </NavLink>

          {!user ? (
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
          ) : (
            <div className="nav-mobile-user">

              <Link to="/profile" onClick={closeMenu}>
                Ver perfil
              </Link>

              <Link to="/orders" onClick={closeMenu}>
                Mis pedidos
              </Link>

              <Link to="/products" onClick={closeMenu}>
                Mis productos
              </Link>

              <Link to="/favorites" onClick={closeMenu}>
                Favoritos
              </Link>

              {hasDashboardAccess && (
                <Link to="/dashboard" onClick={closeMenu}>
                  Administración
                </Link>
              )}
              
              {hasPosAccess && (
                <Link to="/pos" onClick={closeMenu}>
                  Punto de venta
                </Link>
              )}

              <button onClick={handleLogout}>
                Cerrar sesión
              </button>

            </div>
          )}

        </nav>

        {/* ACCIONES */}
        <div className="nav-actions">

          {!user ? (
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
          ) : (
            <div className="nav-user" ref={menuRef}>

              <div onClick={() => setOpen(!open)}>
                {user.photo ? (
                  <img src={user.photo} className="nav-avatar" />
                ) : (
                  <div className="nav-avatar-fallback">
                    {getInitials(user.username)}
                  </div>
                )}
              </div>

              {open && (
                <div className="nav-dropdown">

                  <Link to="/profile">
                    Ver perfil
                  </Link>

                  <Link to="/orders">
                    Mis pedidos
                  </Link>

                  <Link to="/products">
                    Mis productos
                  </Link>

                  <Link to="/favorites">
                    Favoritos
                  </Link>

                  {hasDashboardAccess && (
                    <Link to="/dashboard">
                      Administración
                    </Link>
                  )}
                  
                  {hasPosAccess && (
                    <Link to="/pos">
                      Punto de venta
                    </Link>
                  )}

                  <div className="divider" />

                  <button onClick={handleLogout}>
                    Cerrar sesión
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
  );
}