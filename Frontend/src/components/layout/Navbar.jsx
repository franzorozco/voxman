import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import "./Navbar.css";

export default function Navbar({ logo }) {

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [open, setOpen] = useState(false); // dropdown
  const [menuOpen, setMenuOpen] = useState(false); // mobile menu

  const isAdmin = user?.roles?.includes("Administrador");
  const menuRef = useRef();

  const getInitials = (username) => {
    if (!username) return "?";
    return username.slice(0, 2).toUpperCase();
  };

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

  return (
    <header className="nav-header">
      <div className="nav-container">

        {/* LOGO */}
        <div className="nav-logo">
          <img src={logo} alt="VOXman" />
        </div>

        {/* NAV DESKTOP */}
        <nav className="nav-links">
          <Link to="/">Inicio</Link>
          <Link to="/shop">Tienda</Link>
          <Link to="/collections">Colecciones</Link>
          <Link to="/nosotros">Nosotros</Link>
        </nav>

        {/* ACCIONES DESKTOP */}
        <div className="nav-actions">

          {!user ? (
            <>
              <Link to="/login" className="nav-btn nav-btn-outline">Login</Link>
              <Link to="/register" className="nav-btn nav-btn-solid">Registro</Link>
            </>
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
                  <Link to="/profile">Ver perfil</Link>
                  <Link to="/orders">Mis pedidos</Link>
                  <Link to="/products">Mis productos</Link>
                  <Link to="/favorites">Favoritos</Link>

                  {isAdmin && (
                    <Link to="/dashboard">
                      Administración de negocio
                    </Link>
                  )}

                  <div className="divider" />
                  <button onClick={handleLogout}>Cerrar sesión</button>
                </div>
              )}
            </div>
          )}

          {/* BOTÓN HAMBURGUESA */}
          <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </div>

        </div>
      </div>

      {/* MENÚ MOBILE */}
      <div className={`mobile-menu ${menuOpen ? "active" : ""}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
        <Link to="/shop" onClick={() => setMenuOpen(false)}>Tienda</Link>
        <Link to="/collections" onClick={() => setMenuOpen(false)}>Colecciones</Link>

        <div className="divider" />

        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Registro</Link>
          </>
        ) : (
          <>
            <Link to="/profile">Perfil</Link>
            <Link to="/orders">Pedidos</Link>
            <Link to="/favorites">Favoritos</Link>
            <button onClick={handleLogout}>Cerrar sesión</button>
          </>
        )}
      </div>
    </header>
  );
}