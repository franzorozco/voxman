import { useState, useEffect } from "react";
import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [collapsed, setCollapsed] = useState(
    window.innerWidth <= 900
  );

  useEffect(() => {
    if (window.innerWidth <= 900) {
      setCollapsed(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();

    window.location.href = "/login";
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `nav-link ${isActive ? "active" : ""}`
      }
    >
      <Icon size={18} />
      {!collapsed && label}
    </NavLink>
  );


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

            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          </div>

          {/* TIENDA */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "TIENDA"}</p>

            <NavItem to="/dashboard/products" icon={Package} label="Productos" />
            <NavItem to="/dashboard/categories" icon={Shapes} label="Categorías" />
            <NavItem to="/dashboard/inventory" icon={Boxes} label="Inventario" />
            <NavItem to="/dashboard/orders" icon={ShoppingCart} label="Órdenes" />
            <NavItem to="/dashboard/returns" icon={RotateCcw} label="Devoluciones" />
            <NavItem to="/dashboard/shipping" icon={Truck} label="Envíos" />
            <NavItem to="/dashboard/sales" icon={BarChart3} label="Ventas" />
          </div>


          {/* CONFIGURACIÓN DE PRODUCTO */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "CATÁLOGO"}</p>

            <NavItem to="/dashboard/product-types" icon={Package} label="Tipos de producto" />
            <NavItem to="/dashboard/attributes" icon={Shapes} label="Atributos" />
            <NavItem to="/dashboard/attribute-values" icon={Boxes} label="Valores de atributos" />
            <NavItem to="/dashboard/sizes" icon={ShoppingCart} label="Tallas" />
            <NavItem to="/dashboard/fits" icon={RotateCcw} label="Fits" />
          </div>


          {/* CLIENTES */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "CLIENTES"}</p>

            <NavItem to="/dashboard/clients" icon={Users} label="Clientes" />
            <NavItem to="/dashboard/history" icon={History} label="Historial" />
            <NavItem to="/dashboard/segments" icon={UserRoundSearch} label="Segmentos" />
          </div>

          {/* MARKETING */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "MARKETING"}</p>

            <NavItem to="/dashboard/coupons" icon={TicketPercent} label="Cupones" />
            <NavItem to="/dashboard/promotions" icon={BadgePercent} label="Promociones" />
            <NavItem to="/dashboard/carts" icon={ShoppingBasket} label="Carritos" />
          </div>

          {/* SISTEMA */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "SISTEMA"}</p>

            <NavItem to="/dashboard/users" icon={Users} label="Usuarios" />
            <NavItem to="/dashboard/roles" icon={Shield} label="Roles" />
            <NavItem to="/dashboard/permissions" icon={KeyRound} label="Permisos" />
            <NavItem to="/dashboard/settings" icon={Settings} label="Configuración" />
            <NavItem to="/dashboard/logs" icon={FileText} label="Logs" />
          </div>

        </nav>

        <div className="sidebar-footer">
          {!collapsed && `VOXman © ${new Date().getFullYear()}`}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">

          <div className="topbar-left">
            <h3>Panel de Administración</h3>
          </div>

          <div className="topbar-right">

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
              <Link to="/" className="topbar-btn home-btn">
                <House size={16} />
                <span>Inicio</span>
              </Link>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="topbar-btn logout-btn"
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
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