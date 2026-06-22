import { useState, useEffect } from "react";
import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import "./Dashboard.css";
import logo_black from "../../assets/global/logo_black.png";
import logo_white from "../../assets/global/logo_white.png";
import CanAccess from "../../components/ui/CanAccess";
import AttendanceWidget from "./components/AttendanceWidget/AttendanceWidget";

import {
  LayoutDashboard,
  Package,
  PackagePlus,
  Shapes,
  Boxes,
  ShoppingCart,
  RotateCcw,
  Truck,
  BarChart3,
  Users,
  UserRoundSearch,
  TicketPercent,
  BadgePercent,
  ShoppingBasket,
  Shield,
  KeyRound,
  FileText,
  Settings,
  Layers3,
  Moon,
  Sun,
  LogOut,
  House,
  ChevronDown,
  UserCircle2,
  Store,
  Ticket,
  AlertTriangle,
  DollarSign
} from "lucide-react";

export default function DashboardLayout() {

  const location = useLocation();

  const { logout, user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [collapsed, setCollapsed] = useState(
    window.innerWidth <= 1024
  );

  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setCollapsed(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const NavItem = ({ to, icon: Icon, label, end = false }) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `nav-link ${isActive ? "active" : ""}`
      }
    >
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
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

        {/* TOGGLE BUTTON OUTSIDE SIDEBAR */}
        <button
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          ☰
        </button>

        {/* SIDEBAR */}
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>


          <div className="sidebar-logo">
            {!collapsed && (
              <img
                src={isDark ? logo_black : logo_white}
                alt="VOXman"
              />
            )}
          </div>

          <nav className="sidebar-nav">

            {/* PANEL */}
            <div className="nav-section">

              <p className="section-title">
                {!collapsed && "PANEL"}
              </p>

            <NavItem
              to="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              end
            />

            </div>

            {/* CATÁLOGO */}
            <div className="nav-section">

              <p className="section-title">
                {!collapsed && "CATÁLOGO"}
              </p>

              <CanAccess permission="view_products">
                <NavItem
                  to="/dashboard/products"
                  icon={Package}
                  label="Productos"
                />
              </CanAccess>

              <CanAccess permission="view_products">
                <NavItem
                  to="/dashboard/bundles"
                  icon={PackagePlus}
                  label="Conjuntos"
                />
              </CanAccess>



              <CanAccess permission="view_inventory">
                <NavItem
                  to="/dashboard/inventory"
                  icon={Boxes}
                  label="Inventario"
                />
              </CanAccess>

              <CanAccess permission="manage_inventory">
                <NavItem
                  to="/dashboard/inventory/quarantine"
                  icon={AlertTriangle}
                  label="Mermas/Cuarentena"
                />
              </CanAccess>

              <CanAccess permission="view_suppliers">
                <NavItem
                  to="/dashboard/suppliers"
                  icon={Truck}
                  label="Proveedores"
                />
              </CanAccess>

              <CanAccess permission="view_purchases">
                <NavItem
                  to="/dashboard/purchases"
                  icon={FileText}
                  label="Compras"
                />
              </CanAccess>

              <CanAccess permission="manage_settings">
                <NavItem
                  to="/dashboard/settings"
                  icon={Layers3}
                  label="Configuración"
                />
              </CanAccess>

            </div>

            {/* FINANZAS */}
            <div className="nav-section">

              <p className="section-title">
                {!collapsed && "FINANZAS"}
              </p>

              <NavItem
                to="/dashboard/finance"
                icon={DollarSign}
                label="Finanzas"
              />

            </div>

            {/* COMERCIAL */}
            <div className="nav-section">

              <p className="section-title">
                {!collapsed && "COMERCIAL"}
              </p>

              <NavItem
                to="/dashboard/orders"
                icon={ShoppingCart}
                label="Órdenes"
              />

              <NavItem
                to="/dashboard/sales"
                icon={BarChart3}
                label="Ventas"
              />

              <NavItem
                to="/dashboard/clients"
                icon={Users}
                label="Clientes"
              />

              <NavItem
                to="/dashboard/returns"
                icon={RotateCcw}
                label="Devoluciones"
              />

              <NavItem
                to="/dashboard/carts"
                icon={ShoppingBasket}
                label="Carritos"
              />

            </div>

            {/* MARKETING */}
            <div className="nav-section">

              <p className="section-title">
                {!collapsed && "MARKETING"}
              </p>

              <CanAccess permission="view_promotions">
                <NavItem
                  to="/dashboard/promotions"
                  icon={BadgePercent}
                  label="Promociones"
                />
              </CanAccess>

              <CanAccess permission="view_giftcards">
                <NavItem
                  to="/dashboard/giftcards"
                  icon={Ticket}
                  label="Giftcards"
                />
              </CanAccess>
            </div>

            {/* LOGÍSTICA */}
            <div className="nav-section">

              <p className="section-title">
                {!collapsed && "LOGÍSTICA"}
              </p>

              <NavItem
                to="/dashboard/shipping"
                icon={Truck}
                label="Envíos"
              />

            </div>

            {/* RECURSOS HUMANOS */}
            <div className="nav-section">

              <p className="section-title">
                {!collapsed && "RECURSOS HUMANOS"}
              </p>

              <NavItem
                to="/dashboard/employees"
                icon={UserRoundSearch}
                label="Empleados"
              />

              <NavItem
                to="/dashboard/payroll"
                icon={FileText}
                label="Nómina y Pagos"
              />

              <NavItem
                to="/dashboard/attendances"
                icon={BarChart3}
                label="Control Asistencia"
              />

            </div>

            {/* SISTEMA */}
            <div className="nav-section">

              <p className="section-title">
                {!collapsed && "SISTEMA"}
              </p>

              <CanAccess permission="view_branches">
                <NavItem
                  to="/dashboard/branches"
                  icon={Store}
                  label="Sucursales"
                />
              </CanAccess>

              <CanAccess permission="view_users">
                <NavItem
                  to="/dashboard/users"
                  icon={Users}
                  label="Usuarios"
                />
              </CanAccess>

              <CanAccess permission="manage_roles">
                <NavItem
                  to="/dashboard/roles"
                  icon={Shield}
                  label="Roles"
                />
              </CanAccess>

              <CanAccess permission="manage_roles">
                <NavItem
                  to="/dashboard/permissions"
                  icon={KeyRound}
                  label="Permisos"
                />
              </CanAccess>

              <CanAccess permission="manage_settings">
                <NavItem
                  to="/dashboard/settings"
                  icon={Settings}
                  label="Configuración"
                />
              </CanAccess>

              <CanAccess permission="manage_settings">
                <NavItem
                  to="/dashboard/logs"
                  icon={FileText}
                  label="Logs"
                />
              </CanAccess>
            </div>
          </nav>
          <div className="sidebar-footer">
            {!collapsed && `VOXman © ${new Date().getFullYear()}`}
          </div>

        </aside>

        {/* MAIN */}
        <main className="main">

          <div className="topbar">

            <div className="topbar-left">
              <h3>Panel de Administración</h3>
            </div>

            <div className="topbar-right">
              <button
                onClick={toggleTheme}
                className="topbar-btn theme-btn"
                title="Cambiar tema"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div 
                className="topbar-user" 
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <UserCircle2 size={34} />
                <div className="topbar-user-info">
                  <span className="user-name">
                    {user?.username || "SIN SESIÓN"}
                  </span>
                  <small className="user-email">
                    {user?.email || "correo@voxman.com"}
                  </small>
                </div>
                <ChevronDown size={16} />

                {showUserDropdown && (
                  <>
                    <div 
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUserDropdown(false);
                      }}
                    />
                    <div className="user-dropdown" style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      minWidth: '220px',
                      zIndex: 999
                    }}>
                      <div style={{ padding: '4px 0 12px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                        <AttendanceWidget />
                      </div>
                      
                      <Link
                        to="/"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          background: 'transparent', border: 'none', color: 'var(--text-main)',
                          padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                          textDecoration: 'none', fontWeight: 500, fontSize: '14px'
                        }}
                      >
                        <House size={16} />
                        <span>Inicio</span>
                      </Link>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowUserDropdown(false);
                          setShowLogoutModal(true);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          background: 'transparent', border: 'none', color: 'var(--color-danger)',
                          padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                          textAlign: 'left', fontWeight: 500, fontSize: '14px'
                        }}
                      >
                        <LogOut size={16} />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
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
// force reload
