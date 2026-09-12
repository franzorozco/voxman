import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, ShoppingBag, Users, Package, AlertTriangle,
  RotateCcw, Truck, ShoppingCart, DollarSign, BarChart2,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle,
  ChevronRight, Warehouse, CreditCard, Tag, Gift,
  FileText, Activity, RefreshCw
} from "lucide-react";

import { getSales } from "../../../../api/admin/sales";
import { getInventoryStats } from "../../../../api/admin/inventory";
import { getCustomerKpis } from "../../../../api/admin/customers";
import { getFinanceDashboard } from "../../../../api/admin/finance";
import { getPurchaseStats } from "../../../../api/admin/purchases";
import { getDeliverySchedules } from "../../../../api/admin/orderNetwork";
import { getReturns } from "../../../../api/admin/returns";

import "./Home.css";

const fmt = (n) =>
  new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n ?? 0);

const fmtNum = (n) =>
  new Intl.NumberFormat("es-VE").format(n ?? 0);

const today = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

const KpiCard = ({ icon: Icon, label, value, sub, color, loading }) => (
  <div className={`hd-kpi-card ${color || ""}`}>
    <div className="hd-kpi-header">
      <div className="hd-kpi-icon-box">
        <Icon size={20} />
      </div>
    </div>
    <div className="hd-kpi-body">
      {loading ? (
        <div className="hd-skeleton hd-skeleton-lg" />
      ) : (
        <h3 className="hd-kpi-value">{value}</h3>
      )}
      <p className="hd-kpi-label">{label}</p>
      {sub && <p className="hd-kpi-sub">{sub}</p>}
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    paid: { label: "Pagado", cls: "badge-success" },
    pending: { label: "Pendiente", cls: "badge-warning" },
    cancelled: { label: "Cancelado", cls: "badge-danger" },
    partial: { label: "Parcial", cls: "badge-info" },
    preparing: { label: "Preparando", cls: "badge-info" },
    ready: { label: "Listo", cls: "badge-success" },
    in_transit: { label: "En camino", cls: "badge-warning" },
    delivered: { label: "Entregado", cls: "badge-success" },
    failed: { label: "Fallido", cls: "badge-danger" },
    approved: { label: "Aprobado", cls: "badge-success" },
    rejected: { label: "Rechazado", cls: "badge-danger" },
  };
  const s = map[status] || { label: status, cls: "badge-default" };
  return <span className={`hd-badge ${s.cls}`}>{s.label}</span>;
};

export default function Home() {
  const [salesData, setSalesData] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [customerKpis, setCustomerKpis] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const todayStr = today();

  const loadKpis = useCallback(async () => {
    setLoadingKpis(true);
    try {
      const [invRes, custRes, finRes] = await Promise.allSettled([
        getInventoryStats(),
        getCustomerKpis(),
        getFinanceDashboard(),
      ]);
      if (invRes.status === "fulfilled") setInventoryStats(invRes.value.data);
      if (custRes.status === "fulfilled") setCustomerKpis(custRes.value.data);
      if (finRes.status === "fulfilled") setFinanceData(finRes.value.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKpis(false);
    }
  }, []);

  const loadTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const [salesRes, ordersRes, returnsRes] = await Promise.allSettled([
        getSales({ per_page: 8, sortBy: "created_at", sortDir: "desc" }),
        getDeliverySchedules({ per_page: 6 }),
        getReturns({ status: "pending", per_page: 5 }),
      ]);
      if (salesRes.status === "fulfilled") {
        const d = salesRes.value.data;
        const arr = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        setRecentSales(arr);
        if (d?.summary) setSalesData(d.summary);
      }
      if (ordersRes.status === "fulfilled") {
        const d = ordersRes.value.data;
        setPendingOrders(Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []));
      }
      if (returnsRes.status === "fulfilled") {
        const d = returnsRes.value.data;
        setPendingReturns(Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTables(false);
    }
  }, [todayStr]);

  useEffect(() => {
    loadKpis();
    loadTables();
  }, [loadKpis, loadTables]);

  const handleRefresh = () => {
    setLastRefresh(new Date());
    loadKpis();
    loadTables();
  };

  const financeSummary = financeData?.summary || {};
  const netProfit = financeSummary.net_profit ?? 0;
  const totalRevenue = financeSummary.total_revenue ?? 0;
  const totalExpenses = financeSummary.total_expenses ?? 0;
  const cashBalance = financeSummary.treasury?.cash_balance ?? 0;
  const bankBalance = financeSummary.treasury?.bank_balance ?? 0;

  const userName = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u?.profile?.first_name || u?.name || "Administrador";
    } catch {
      return "Administrador";
    }
  })();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="hd-container">

      <div className="hd-top">
        <div className="hd-greeting">
          <h1 className="hd-greeting-title">{greeting}, {userName} 👋</h1>
          <p className="hd-greeting-sub">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button className="hd-refresh-btn" onClick={handleRefresh} title="Actualizar datos">
          <RefreshCw size={16} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="hd-kpi-grid">
        <KpiCard icon={TrendingUp} label="Ingresos totales" value={fmt(totalRevenue)} sub={`${fmtNum(salesData?.total_sales ?? 0)} transacciones`} color="kpi-green" loading={loadingKpis} />
        <KpiCard icon={DollarSign} label="Ganancia neta" value={fmt(netProfit)} sub={`Gastos: ${fmt(totalExpenses)}`} color={netProfit >= 0 ? "kpi-blue" : "kpi-red"} loading={loadingKpis} />
        <KpiCard icon={Package} label="Unidades en stock" value={fmtNum(inventoryStats?.total_items)} sub={`Valor: ${fmt(inventoryStats?.total_retail_value)}`} color="kpi-purple" loading={loadingKpis} />
        <KpiCard icon={AlertTriangle} label="Alertas de stock" value={fmtNum(inventoryStats?.low_stock_alerts)} sub="Productos agotados o bajos" color={inventoryStats?.low_stock_alerts > 0 ? "kpi-orange" : "kpi-green"} loading={loadingKpis} />
        <KpiCard icon={Users} label="Clientes totales" value={fmtNum(customerKpis?.total_customers)} sub={`${fmtNum(customerKpis?.new_this_month ?? 0)} nuevos este mes`} color="kpi-teal" loading={loadingKpis} />
        <KpiCard icon={CreditCard} label="Caja disponible" value={fmt(cashBalance)} sub={`Banco: ${fmt(bankBalance)}`} color="kpi-indigo" loading={loadingKpis} />
        <KpiCard icon={ShoppingBag} label="Ticket promedio" value={fmt(salesData?.average_ticket)} sub="Por transacción pagada" color="kpi-rose" loading={loadingKpis} />
        <KpiCard icon={BarChart2} label="Descuentos dados" value={fmt(salesData?.total_discount)} sub="Total del período" color="kpi-amber" loading={loadingKpis} />
      </div>

      <div className="hd-section">
        <h2 className="hd-section-title">Módulos del Sistema</h2>
        <div className="hd-quick-links">
          {[
            { to: "/dashboard/sales",       icon: ShoppingBag,   label: "Ventas",        sub: "Historial y detalles",     color: "ql-green"   },
            { to: "/dashboard/inventory",   icon: Warehouse,     label: "Inventario",    sub: "Stock y movimientos",      color: "ql-blue"    },
            { to: "/dashboard/products",    icon: Package,       label: "Productos",     sub: "Catálogo y variantes",     color: "ql-purple"  },
            { to: "/dashboard/customers",   icon: Users,         label: "Clientes",      sub: "Base de clientes",         color: "ql-teal"    },
            { to: "/dashboard/orders",      icon: Truck,         label: "Pedidos",       sub: "Delivery y envíos",        color: "ql-orange"  },
            { to: "/dashboard/carts",       icon: ShoppingCart,  label: "Proformas",     sub: "Carritos activos",         color: "ql-indigo"  },
            { to: "/dashboard/returns",     icon: RotateCcw,     label: "Devoluciones",  sub: "Solicitudes pendientes",   color: "ql-rose"    },
            { to: "/dashboard/promotions",  icon: Tag,           label: "Promociones",   sub: "Descuentos y cupones",     color: "ql-amber"   },
            { to: "/dashboard/giftcards",   icon: Gift,          label: "Giftcards",     sub: "Tarjetas de regalo",       color: "ql-pink"    },
            { to: "/dashboard/finance",     icon: DollarSign,    label: "Finanzas",      sub: "Dashboard financiero",     color: "ql-emerald" },
            { to: "/dashboard/purchases",   icon: FileText,      label: "Compras",       sub: "Abastecimiento",           color: "ql-sky"     },
            { to: "/dashboard/logs",        icon: Activity,      label: "Auditoría",     sub: "Registro de sistema",      color: "ql-slate"   },
          ].map(({ to, icon: Icon, label, sub, color }) => (
            <Link key={to} to={to} className={`hd-ql-card ${color}`}>
              <div className="hd-ql-icon"><Icon size={22} /></div>
              <div className="hd-ql-info">
                <span className="hd-ql-label">{label}</span>
                <span className="hd-ql-sub">{sub}</span>
              </div>
              <ChevronRight size={16} className="hd-ql-arrow" />
            </Link>
          ))}
        </div>
      </div>

      <div className="hd-tables-grid">

        <div className="hd-table-card">
          <div className="hd-table-header">
            <h2 className="hd-table-title"><CheckCircle size={18} />Ventas Recientes</h2>
            <Link to="/dashboard/sales" className="hd-table-link">Ver todas <ChevronRight size={14} /></Link>
          </div>
          {loadingTables ? (
            <div className="hd-table-loading">{[...Array(5)].map((_,i)=><div key={i} className="hd-skeleton hd-skeleton-row"/>)}</div>
          ) : recentSales.length === 0 ? (
            <p className="hd-empty">No hay ventas recientes.</p>
          ) : (
            <div className="hd-table-scroll">
              <table className="hd-table">
                <thead><tr><th>Factura</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
                <tbody>
                  {recentSales.map((s) => {
                    const clientName = s.customer?.user?.profile
                      ? `${s.customer.user.profile.first_name} ${s.customer.user.profile.last_name}`
                      : s.guest?.name || "Invitado";
                    return (
                      <tr key={s.id}>
                        <td className="hd-mono">{s.invoice_number?.slice(0,12) || s.id?.slice(0,8)}</td>
                        <td>{clientName}</td>
                        <td className="hd-bold">{fmt(s.total)}</td>
                        <td><StatusBadge status={s.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="hd-table-card">
          <div className="hd-table-header">
            <h2 className="hd-table-title"><Truck size={18} />Pedidos Activos</h2>
            <Link to="/dashboard/orders" className="hd-table-link">Ver todos <ChevronRight size={14} /></Link>
          </div>
          {loadingTables ? (
            <div className="hd-table-loading">{[...Array(4)].map((_,i)=><div key={i} className="hd-skeleton hd-skeleton-row"/>)}</div>
          ) : pendingOrders.length === 0 ? (
            <p className="hd-empty">No hay pedidos activos.</p>
          ) : (
            <div className="hd-table-scroll">
              <table className="hd-table">
                <thead><tr><th>ID</th><th>Destino</th><th>Estado</th><th>Fecha</th></tr></thead>
                <tbody>
                  {pendingOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="hd-mono">{o.id?.slice(0,8)}</td>
                      <td>{o.destination_address?.slice(0,24) || "—"}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="hd-muted">{o.scheduled_date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="hd-table-card">
          <div className="hd-table-header">
            <h2 className="hd-table-title"><RotateCcw size={18} />Devoluciones Pendientes</h2>
            <Link to="/dashboard/returns" className="hd-table-link">Ver todas <ChevronRight size={14} /></Link>
          </div>
          {loadingTables ? (
            <div className="hd-table-loading">{[...Array(3)].map((_,i)=><div key={i} className="hd-skeleton hd-skeleton-row"/>)}</div>
          ) : pendingReturns.length === 0 ? (
            <p className="hd-empty">Sin devoluciones pendientes 🎉</p>
          ) : (
            <div className="hd-table-scroll">
              <table className="hd-table">
                <thead><tr><th>ID</th><th>Motivo</th><th>Cant.</th><th>Estado</th></tr></thead>
                <tbody>
                  {pendingReturns.map((r) => (
                    <tr key={r.id}>
                      <td className="hd-mono">{r.id?.slice(0,8)}</td>
                      <td>{r.reason?.slice(0,28) || "—"}</td>
                      <td>{r.quantity}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <p className="hd-last-refresh">
        <Clock size={13} />
        Última actualización: {lastRefresh.toLocaleTimeString("es-ES")}
      </p>

    </div>
  );
}

