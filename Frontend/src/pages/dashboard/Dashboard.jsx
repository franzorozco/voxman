import { getImageUrl } from '../../utils/imageUtils';
import { useState, useEffect } from "react";
import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import "./Dashboard.css";
import { API_BASE_URL } from "../../config/api";
const logo_black = getImageUrl('/system/logos/logo_black_sinfondo.png');
const logo_white = getImageUrl('/system/logos/logo_white_sinfondo.png');
import CanAccess from "../../components/ui/CanAccess";
import AttendanceWidget from "./components/AttendanceWidget/AttendanceWidget";
import GlobalScannerModal from "../../components/ui/GlobalScannerModal";
import ModalProtection from "./components/ModalProtection";
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
  DollarSign,
  Film,
  Settings2
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
      <ModalProtection />
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
            
            {/* 1. DASHBOARD */}
            <div className="nav-section">
              <p className="section-title">
                {!collapsed && "RESUMEN"}
              </p>
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" end />
            </div>

            {/* 2. VENTAS Y FACTURACIÓN */}
            <CanAccess permission={['manage_sales', 'view_sales', 'view_users', 'view_returns', 'view_carts']}>
              <div className="nav-section">
                <p className="section-title">
                  {!collapsed && "VENTAS Y COMERCIAL"}
                </p>
                <CanAccess permission="manage_sales">
                  <NavItem to="/dashboard/orders" icon={ShoppingCart} label="Entregas (Redes)" />
                </CanAccess>
                <CanAccess permission="view_sales">
                  <NavItem to="/dashboard/sales" icon={BarChart3} label="Historial de Ventas" />
                </CanAccess>
                <CanAccess permission="view_users">
                  <NavItem to="/dashboard/clients" icon={Users} label="Clientes" />
                </CanAccess>
                <CanAccess permission="view_returns">
                  <NavItem to="/dashboard/returns" icon={RotateCcw} label="Devoluciones" />
                </CanAccess>
                <CanAccess permission="view_carts">
                  <NavItem to="/dashboard/carts" icon={ShoppingBasket} label="Carritos / Proformas" />
                </CanAccess>
              </div>
            </CanAccess>

            {/* 3. CATÁLOGO E INVENTARIO */}
            <CanAccess permission={['view_products', 'view_inventory_own_branch', 'adjust_inventory', 'transfer_inventory']}>
              <div className="nav-section">
                <p className="section-title">
                  {!collapsed && "CATÁLOGO E INVENTARIO"}
                </p>
                <CanAccess permission="manage_settings">
                  <NavItem to="/dashboard/settings" icon={Settings} label="Ajustes de Catálogo" />
                </CanAccess>
                <CanAccess permission="view_products">
                  <NavItem to="/dashboard/products" icon={Package} label="Productos" />
                </CanAccess>
                <CanAccess permission="view_products">
                  <NavItem to="/dashboard/bundles" icon={PackagePlus} label="Conjuntos (Combos)" />
                </CanAccess>
                <CanAccess permission="view_inventory_own_branch">
                  <NavItem to="/dashboard/inventory" icon={Boxes} label="Stock Global" />
                </CanAccess>
                <CanAccess permission="adjust_inventory">
                  <NavItem to="/dashboard/inventory/quarantine" icon={AlertTriangle} label="Mermas y Cuarentena" />
                </CanAccess>
                <CanAccess permission="transfer_inventory">
                  <NavItem to="/dashboard/inventory/transfers" icon={Truck} label="Traslados (Próximamente)" />
                </CanAccess>
              </div>
            </CanAccess>

            {/* 4. COMPRAS Y ABASTECIMIENTO */}
            <CanAccess permission={['view_suppliers', 'view_purchases', 'receive_inventory', 'manage_expenses']}>
              <div className="nav-section">
                <p className="section-title">
                  {!collapsed && "ABASTECIMIENTO"}
                </p>
                <CanAccess permission="view_suppliers">
                  <NavItem to="/dashboard/suppliers" icon={Truck} label="Proveedores" />
                </CanAccess>
                <CanAccess permission="view_purchases">
                  <NavItem to="/dashboard/purchases" icon={FileText} label="Órdenes de Compra" />
                </CanAccess>
                <CanAccess permission="manage_expenses">
                  <NavItem to="/dashboard/purchases/accounts-payable" icon={DollarSign} label="Cuentas por Pagar" />
                </CanAccess>
              </div>
            </CanAccess>

            {/* 5. FINANZAS Y CONTABILIDAD */}
            <CanAccess permission={['view_finance', 'view_cashflow', 'view_finance_reports']}>
              <div className="nav-section">
                <p className="section-title">
                  {!collapsed && "FINANZAS"}
                </p>
              <CanAccess permission="view_finance">
                <NavItem to="/dashboard/finance" icon={DollarSign} label="Gastos y Capital" end />
              </CanAccess>
              <CanAccess permission="view_cashflow">
                <NavItem to="/dashboard/finance/cashflow" icon={BarChart3} label="Flujo de Caja" />
              </CanAccess>
              <CanAccess permission="view_finance_reports">
                <NavItem to="/dashboard/finance/reports" icon={FileText} label="Reportes Contables" />
              </CanAccess>
              </div>
            </CanAccess>

            {/* 6. RECURSOS HUMANOS */}
            <CanAccess permission={['manage_executives', 'manage_user_salaries']}>
              <div className="nav-section">
                <p className="section-title">
                  {!collapsed && "RECURSOS HUMANOS"}
                </p>
                <CanAccess permission="view_owners">
                  <NavItem to="/dashboard/owners" icon={UserRoundSearch} label="Socios / Dueños" />
                </CanAccess>
                <CanAccess permission="manage_executives">
                  <NavItem to="/dashboard/employees" icon={UserRoundSearch} label="Personal" />
                </CanAccess>
                <CanAccess permission="manage_executives">
                  <NavItem to="/dashboard/attendances" icon={BarChart3} label="Asistencia" />
                </CanAccess>
                <CanAccess permission="manage_user_salaries">
                  <NavItem to="/dashboard/payroll" icon={FileText} label="Nómina y Pagos" />
                </CanAccess>
              </div>
            </CanAccess>

            {/* 7. MARKETING Y FIDELIZACIÓN */}
            <CanAccess permission={['view_promotions', 'view_giftcards']}>
              <div className="nav-section">
                <p className="section-title">
                  {!collapsed && "MARKETING"}
                </p>
                <CanAccess permission="view_promotions">
                  <NavItem to="/dashboard/shop-shorts" icon={Film} label="Shorts (Tienda)" />
                </CanAccess>
                <CanAccess permission="view_promotions">
                  <NavItem to="/dashboard/promotions" icon={BadgePercent} label="Promociones" />
                </CanAccess>
                <CanAccess permission="view_giftcards">
                  <NavItem to="/dashboard/giftcards" icon={Ticket} label="Giftcards" />
                </CanAccess>
                <CanAccess permission="view_promotions">
                  <NavItem to="/dashboard/marketing/campaigns" icon={Layers3} label="Campañas (Próximamente)" />
                </CanAccess>
              </div>
            </CanAccess>

            {/* 8. LOGÍSTICA */}
            <CanAccess permission="transfer_inventory">
              <div className="nav-section">
                <p className="section-title">
                  {!collapsed && "LOGÍSTICA"}
                </p>
                <CanAccess permission="transfer_inventory">
                  <NavItem to="/dashboard/shipping" icon={Truck} label="Rutas de Envío" />
                </CanAccess>
              </div>
            </CanAccess>

            {/* 9. SISTEMA Y CONFIGURACIÓN */}
            <CanAccess permission={['view_branches', 'view_users', 'manage_roles', 'manage_settings', 'view_audit_logs']}>
              <div className="nav-section">
                <p className="section-title">
                  {!collapsed && "SISTEMA"}
                </p>
                <CanAccess permission="view_branches">
                  <NavItem to="/dashboard/branches" icon={Store} label="Sucursales" />
                </CanAccess>
                <CanAccess permission="view_users">
                  <NavItem to="/dashboard/users" icon={Users} label="Usuarios" />
                </CanAccess>
                <CanAccess permission="manage_roles">
                  <NavItem to="/dashboard/roles" icon={Shield} label="Roles" />
                </CanAccess>
                <CanAccess permission="manage_roles">
                  <NavItem to="/dashboard/permissions" icon={KeyRound} label="Permisos" />
                </CanAccess>

                <CanAccess permission="view_audit_logs">
                  <NavItem to="/dashboard/logs" icon={FileText} label="Auditoría (Logs)" />
                </CanAccess>
                <CanAccess permission="manage_settings">
                  <NavItem to="/dashboard/system-settings" icon={Settings2} label="Ajustes Globales" />
                </CanAccess>
              </div>
            </CanAccess>

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
            <GlobalScannerModal />
          </div>
        </main>
      </div>
    </>
  );
}
// force reload
