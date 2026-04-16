import React from "react";
import "./Home.css";

export default function Home() {
  return (
    <div className="dashboard-home">

      {/* WELCOME */}
      <div className="welcome">
        <h1>Bienvenido de nuevo 👋</h1>
        <p>Resumen de tu tienda VOXman</p>
      </div>

      {/* STATS */}
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

      {/* ACTIONS */}
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

      {/* TABLE */}
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
  );
}