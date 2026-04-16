import { useState } from "react";
import "./Dashboard.css";
import logo from "../../assets/global/logo_black.png";

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

          {/* TOGGLE BUTTON */}
          <button
            className="toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            ☰
          </button>

          {/* LOGO */}
          <div className="sidebar-logo">
            {!collapsed && <img src={logo} alt="VOXman" />}
          </div>

            <nav className="sidebar-nav">

              {/* PANEL */}
              <div className="nav-section">
                <p className="section-title">{!collapsed && "PANEL"}</p>

                <a>
                  <img src="https://cdn-icons-png.flaticon.com/512/1946/1946436.png" />
                  {!collapsed && "Dashboard"}
                </a>
              </div>

              {/* TIENDA */}
              <div className="nav-section">
                <p className="section-title">{!collapsed && "TIENDA"}</p>

                <a><img src="https://cdn-icons-png.flaticon.com/512/3081/3081559.png" /> {!collapsed && "Productos"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/3225/3225209.png" /> {!collapsed && "Categorías"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/679/679720.png" /> {!collapsed && "Inventario"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/1170/1170576.png" /> {!collapsed && "Órdenes"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/679/679720.png" /> {!collapsed && "Devoluciones"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/2331/2331966.png" /> {!collapsed && "Envíos"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/1170/1170576.png" /> {!collapsed && "Ventas"}</a>
              </div>

              {/* CLIENTES */}
              <div className="nav-section">
                <p className="section-title">{!collapsed && "CLIENTES"}</p>

                <a><img src="https://cdn-icons-png.flaticon.com/512/1077/1077012.png" /> {!collapsed && "Clientes"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/747/747376.png" /> {!collapsed && "Historial"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" /> {!collapsed && "Segmentos"}</a>
              </div>

              {/* MARKETING */}
              <div className="nav-section">
                <p className="section-title">{!collapsed && "MARKETING"}</p>

                <a><img src="https://cdn-icons-png.flaticon.com/512/3500/3500833.png" /> {!collapsed && "Cupones"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" /> {!collapsed && "Promociones"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/1828/1828911.png" /> {!collapsed && "Carritos"}</a>
              </div>

              {/* SISTEMA */}
              <div className="nav-section">
                <p className="section-title">{!collapsed && "SISTEMA"}</p>

                <a><img src="https://cdn-icons-png.flaticon.com/512/3135/3135706.png" /> {!collapsed && "Usuarios"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/2099/2099058.png" /> {!collapsed && "Roles"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/3524/3524659.png" /> {!collapsed && "Permisos"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/3524/3524659.png" /> {!collapsed && "Configuración"}</a>
                <a><img src="https://cdn-icons-png.flaticon.com/512/565/565491.png" /> {!collapsed && "Logs"}</a>
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

          <div className="welcome">
            <h1>Bienvenido de nuevo 👋</h1>
            <p>Resumen de tu tienda VOXman</p>
          </div>

          <div className="stats">
            <div className="card">
              <p>Ventas hoy</p>
              <h3>$1,240</h3>
            </div>

            <div className="card">
              <p>Pedidos</p>
              <h3>32</h3>
            </div>

            <div className="card">
              <p>Productos</p>
              <h3>148</h3>
            </div>

            <div className="card">
              <p>Clientes</p>
              <h3>89</h3>
            </div>
          </div>

          <div className="actions">

            <div className="action-card">
              <h3>Productos</h3>
              <p>Gestiona el catálogo de ropa</p>
              <button>Ir</button>
            </div>

            <div className="action-card">
              <h3>Órdenes</h3>
              <p>Revisa pedidos recientes</p>
              <button>Ver</button>
            </div>

            <div className="action-card">
              <h3>Clientes</h3>
              <p>Base de usuarios</p>
              <button>Entrar</button>
            </div>

          </div>

          <div className="table">
            <h3>Últimas órdenes</h3>

            <div className="table-row">
              <span>#1023 Camisa Oversize</span>
              <span>Pendiente</span>
            </div>

            <div className="table-row">
              <span>#1022 Jeans Slim</span>
              <span>Enviado</span>
            </div>

            <div className="table-row">
              <span>#1021 Hoodie Black</span>
              <span>Entregado</span>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}