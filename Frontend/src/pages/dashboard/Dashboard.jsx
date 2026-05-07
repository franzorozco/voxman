import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import "./Dashboard.css";
import logo from "../../assets/global/logo_black.png";

import {
  LayoutDashboard,
  Package,
  Shapes,
  Boxes,
  ShoppingCart,
  RotateCcw,
  Truck,
  BarChart3,
  Users,
  History,
  UserRoundSearch,
  TicketPercent,
  BadgePercent,
  ShoppingBasket,
  Shield,
  KeyRound,
  Settings,
  FileText,

  House,
  LogOut,
  UserCircle2

} from "lucide-react";


export default function DashboardLayout() {

  const { logout, user } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [collapsed, setCollapsed] = useState(
    window.innerWidth <= 900
  );

  const handleLogout = () => {
    logout();

    window.location.href = "/login";
  };

  return (
    <>  

    {/* LOGOUT MODAL */}
    {showLogoutModal && (
      <div className="modal-overlay">

        <div className="logout-modal">

          <div className="logout-icon">
            <LogOut size={38} />
          </div>

          <h2>Cerrar sesión</h2>

          <p>
            ¿Estás seguro de que deseas cerrar sesión?
          </p>

          <div className="logout-actions">

            <button
              className="cancel-btn"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancelar
            </button>

            <button
              className="confirm-btn"
              onClick={handleLogout}
            >
              Sí, cerrar sesión
            </button>

          </div>

        </div>

      </div>
    )}

    <div className="dashboard">

      {/* SIDEBAR */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

        <button
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          ☰
        </button>

        <div className="sidebar-logo">
          {!collapsed && <img src={logo} alt="VOXman" />}
        </div>

        <nav className="sidebar-nav">

          {/* PANEL */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "PANEL"}</p>

            <Link  to="/dashboard">
              <LayoutDashboard size={18} />
              {!collapsed && "Dashboard"}
            </Link >
          </div>

          {/* TIENDA */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "TIENDA"}</p>

            <Link  to="/dashboard/products">
              <Package size={18} />
              {!collapsed && "Productos"}
            </Link >

            <Link  to="/dashboard/categories">
              <Shapes size={18} />
              {!collapsed && "Categorías"}
            </Link >

            <Link  to="/dashboard/inventory">
              <Boxes size={18} />
              {!collapsed && "Inventario"}
            </Link >

            <Link  to="/dashboard/orders">
              <ShoppingCart size={18} />
              {!collapsed && "Órdenes"}
            </Link >

            <Link  to="/dashboard/returns">
              <RotateCcw size={18} />
              {!collapsed && "Devoluciones"}
            </Link >

            <Link  to="/dashboard/shipping">
              <Truck size={18} />
              {!collapsed && "Envíos"}
            </Link >

            <Link  to="/dashboard/sales">
              <BarChart3 size={18} />
              {!collapsed && "Ventas"}
            </Link >
          </div>

          {/* CLIENTES */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "CLIENTES"}</p>

            <Link  to="/dashboard/clients">
              <Users size={18} />
              {!collapsed && "Clientes"}
            </Link >

            <Link  to="/dashboard/history">
              <History size={18} />
              {!collapsed && "Historial"}
            </Link >

            <Link  to="/dashboard/segments">
              <UserRoundSearch size={18} />
              {!collapsed && "Segmentos"}
            </Link >
          </div>

          {/* MARKETING */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "MARKETING"}</p>

            <Link  to="/dashboard/coupons">
              <TicketPercent size={18} />
              {!collapsed && "Cupones"}
            </Link >

            <Link  to="/dashboard/promotions">
              <BadgePercent size={18} />
              {!collapsed && "Promociones"}
            </Link >

            <Link  to="/dashboard/carts">
              <ShoppingBasket size={18} />
              {!collapsed && "Carritos"}
            </Link >
          </div>

          {/* SISTEMA */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "SISTEMA"}</p>

            <Link  to="/dashboard/users">
              <Users size={18} />
              {!collapsed && "Usuarios"}
            </Link >

            <Link  to="/dashboard/roles">
              <Shield size={18} />
              {!collapsed && "Roles"}
            </Link >

            <Link  to="/dashboard/permissions">
              <KeyRound size={18} />
              {!collapsed && "Permisos"}
            </Link >

            <Link  to="/dashboard/settings">
              <Settings size={18} />
              {!collapsed && "Configuración"}
            </Link >

            <Link  to="/dashboard/logs">
              <FileText size={18} />
              {!collapsed && "Logs"}
            </Link >
          </div>

        </nav>

        <div className="sidebar-footer">
          {!collapsed && `VOXman © ${new Date().getFullYear()}`}
        </div>

      </aside>

      {/* MAIN */}
      <main className="main">

        <div className="topbar">

          {/* LEFT */}
          <div className="topbar-left">
            <h3>Panel de Administración</h3>
          </div>

          {/* RIGHT */}
          <div className="topbar-right">

            {/* PERFIL */}
            <div className="topbar-user">
              <UserCircle2 size={34} />

              <div className="topbar-user-info">

                <span className="user-name">
                  {user?.username || "SIN SESION"}
                </span>

                <small className="user-email">
                  {user?.email || "correo@voxman.com"}
                </small>

              </div>
            </div>

            {/* INICIO */}
            <Link to="/" className="topbar-btn home-btn">
              <House size={16} />
              Inicio
            </Link>

            {/* LOGOUT */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="topbar-btn logout-btn"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>

        </div>

        <div className="content">
          <Outlet />
        </div>

      </main>

    </div>
    </>
  );
}