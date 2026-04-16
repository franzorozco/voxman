import { useState } from "react";
import { Outlet } from "react-router-dom";
import "./Dashboard.css";
import logo from "../../assets/global/logo_black.png";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
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

            <a href="/dashboard">
              <img src="https://cdn-icons-png.flaticon.com/512/1946/1946436.png" />
              {!collapsed && "Dashboard"}
            </a>
          </div>

          {/* TIENDA */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "TIENDA"}</p>

            <a href="/dashboard/products">
              <img src="https://cdn-icons-png.flaticon.com/512/3081/3081559.png" />
              {!collapsed && "Productos"}
            </a>

            <a href="/dashboard/categories">
              <img src="https://cdn-icons-png.flaticon.com/512/3225/3225209.png" />
              {!collapsed && "Categorías"}
            </a>

            <a href="/dashboard/inventory">
              <img src="https://cdn-icons-png.flaticon.com/512/679/679720.png" />
              {!collapsed && "Inventario"}
            </a>

            <a href="/dashboard/orders">
              <img src="https://cdn-icons-png.flaticon.com/512/1170/1170576.png" />
              {!collapsed && "Órdenes"}
            </a>

            <a href="/dashboard/returns">
              <img src="https://cdn-icons-png.flaticon.com/512/679/679720.png" />
              {!collapsed && "Devoluciones"}
            </a>

            <a href="/dashboard/shipping">
              <img src="https://cdn-icons-png.flaticon.com/512/2331/2331966.png" />
              {!collapsed && "Envíos"}
            </a>

            <a href="/dashboard/sales">
              <img src="https://cdn-icons-png.flaticon.com/512/1170/1170576.png" />
              {!collapsed && "Ventas"}
            </a>
          </div>

          {/* CLIENTES */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "CLIENTES"}</p>

            <a href="/dashboard/clients">
              <img src="https://cdn-icons-png.flaticon.com/512/1077/1077012.png" />
              {!collapsed && "Clientes"}
            </a>

            <a href="/dashboard/history">
              <img src="https://cdn-icons-png.flaticon.com/512/747/747376.png" />
              {!collapsed && "Historial"}
            </a>

            <a href="/dashboard/segments">
              <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" />
              {!collapsed && "Segmentos"}
            </a>
          </div>

          {/* MARKETING */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "MARKETING"}</p>

            <a href="/dashboard/coupons">
              <img src="https://cdn-icons-png.flaticon.com/512/3500/3500833.png" />
              {!collapsed && "Cupones"}
            </a>

            <a href="/dashboard/promotions">
              <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" />
              {!collapsed && "Promociones"}
            </a>

            <a href="/dashboard/carts">
              <img src="https://cdn-icons-png.flaticon.com/512/1828/1828911.png" />
              {!collapsed && "Carritos"}
            </a>
          </div>

          {/* SISTEMA */}
          <div className="nav-section">
            <p className="section-title">{!collapsed && "SISTEMA"}</p>

            <a href="/dashboard/users">
              <img src="https://cdn-icons-png.flaticon.com/512/3135/3135706.png" />
              {!collapsed && "Usuarios"}
            </a>

            <a href="/dashboard/roles">
              <img src="https://cdn-icons-png.flaticon.com/512/2099/2099058.png" />
              {!collapsed && "Roles"}
            </a>

            <a href="/dashboard/permissions">
              <img src="https://cdn-icons-png.flaticon.com/512/3524/3524659.png" />
              {!collapsed && "Permisos"}
            </a>

            <a href="/dashboard/settings">
              <img src="https://cdn-icons-png.flaticon.com/512/3524/3524659.png" />
              {!collapsed && "Configuración"}
            </a>

            <a href="/dashboard/logs">
              <img src="https://cdn-icons-png.flaticon.com/512/565/565491.png" />
              {!collapsed && "Logs"}
            </a>
          </div>

        </nav>

        <div className="sidebar-footer">
          {!collapsed && `VOXman © ${new Date().getFullYear()}`}
        </div>

      </aside>

      {/* MAIN */}
      <main className="main">

        <div className="topbar">
          <small>Panel de administración</small>
          <small>admin@voxman.com</small>
        </div>

        <div className="content">
          <Outlet />
        </div>

      </main>

    </div>
  );
}