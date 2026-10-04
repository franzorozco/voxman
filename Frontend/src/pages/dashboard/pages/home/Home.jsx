import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, ShoppingBag, Users, Package, AlertTriangle,
  RotateCcw, Truck, ShoppingCart, DollarSign, BarChart2,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle,
  ChevronRight, Warehouse, CreditCard, Tag, Gift,
  FileText, Activity, RefreshCw, Calendar
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

import { getSales } from "../../../../api/admin/sales";
import { getInventoryStats } from "../../../../api/admin/inventory";
import { getCustomerKpis } from "../../../../api/admin/customers";
import { getFinanceDashboard } from "../../../../api/admin/finance";
import { getPurchaseStats } from "../../../../api/admin/purchases";
import { getDeliverySchedules } from "../../../../api/admin/orderNetwork";
import { getReturns } from "../../../../api/admin/returns";
import { useAuthStore } from "../../../../store/authStore";

import "./Home.css";

const getDateParams = (range) => {
  const end = new Date();
  let start = new Date();
  if (range === 'today') {
    start.setHours(0,0,0,0);
  } else if (range === '7d') {
    start.setDate(end.getDate() - 7);
  } else if (range === '30d') {
    start.setDate(end.getDate() - 30);
  } else if (range === 'month') {
    start.setDate(1);
  } else if (range === 'year') {
    start.setMonth(0, 1);
  } else {
    return { start_date: undefined, end_date: undefined, date_from: undefined, date_to: undefined };
  }
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  return { start_date: startStr, end_date: endStr, date_from: startStr, date_to: endStr };
};

const fmt = (n) => {
  const formatted = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);
  return `Bs ${formatted}`;
};

const fmtNum = (n) =>
  new Intl.NumberFormat("es-VE").format(n ?? 0);

const today = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

const KpiCard = ({ icon: Icon, label, value, sub, color, loading }) => (
  <div className={`hd-kpi-card ${color || ""}`}>
    <div className="hd-kpi-icon-box">
      <Icon size={22} />
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
    // Sales
    paid: { label: "Pagado", cls: "badge-success" },
    pending: { label: "Pendiente", cls: "badge-warning" },
    cancelled: { label: "Cancelado", cls: "badge-danger" },
    partial: { label: "Parcial", cls: "badge-info" },
    failed: { label: "Fallido", cls: "badge-danger" },
    approved: { label: "Aprobado", cls: "badge-success" },
    rejected: { label: "Rechazado", cls: "badge-danger" },
    // Orders/Shipments
    requested: { label: "Solicitado", cls: "badge-warning" },
    reserved: { label: "Reservado", cls: "badge-info" },
    preparing: { label: "Preparando", cls: "badge-info" },
    ready_for_pickup: { label: "Para recoger", cls: "badge-success" },
    assigned: { label: "Agendado", cls: "badge-info" },
    on_the_way: { label: "En Camino", cls: "badge-info" },
    at_the_meeting_point: { label: "En Punto", cls: "badge-warning" },
    completed: { label: "Entregado", cls: "badge-success" },
    prepared: { label: "Preparado", cls: "badge-info" },
    packaged: { label: "Empaquetado", cls: "badge-info" },
    shipped: { label: "Remitido", cls: "badge-success" }
  };
  const s = map[status] || { label: status, cls: "badge-default" };
  return <span className={`hd-badge ${s.cls}`}>{s.label}</span>;
};

const P = {
  finance:   ['view_finance'],
  sales:     ['view_sales', 'view_sales_own_branch', 'view_sales_all_branches'],
  inventory: ['view_inventory_own_branch', 'view_inventory_all_branches'],
  customers: ['view_customers'],
  orders:    ['view_orders', 'view_orders_own_branch', 'view_orders_all_branches'],
  returns:   ['view_returns', 'view_returns_own_branch', 'view_returns_all_branches'],
};

// Permiso necesario para ver cada acceso rapido del dashboard
const LINK_PERMS = {
  '/dashboard/sales': P.sales,
  '/dashboard/inventory': P.inventory,
  '/dashboard/products': ['view_products'],
  '/dashboard/customers': P.customers,
  '/dashboard/orders': P.orders,
  '/dashboard/carts': ['view_carts', 'view_carts_own_branch', 'view_carts_all_branches'],
  '/dashboard/returns': P.returns,
  '/dashboard/promotions': ['view_promotions'],
  '/dashboard/giftcards': ['view_giftcards'],
  '/dashboard/finance': P.finance,
  '/dashboard/purchases': ['view_purchases'],
  '/dashboard/logs': ['view_audit_logs'],
};

export default function Home() {
  const authUser = useAuthStore((s) => s.user);
  // Mismo criterio que CanAccess: Owner o permiso explicito. El backend vuelve a validar cada endpoint.
  const canAny = (perms = []) => !!authUser && (authUser.roles?.includes('Owner') || perms.some((p) => authUser.permissions?.includes(p)));
  const gate = (perms, fn) => (canAny(perms) ? fn() : Promise.reject(new Error('sin permiso')));
  const [dateRange, setDateRange] = useState("month");
  const [salesData, setSalesData] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [customerKpis, setCustomerKpis] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [recentSalesFull, setRecentSalesFull] = useState([]);
  const [recentSalesTable, setRecentSalesTable] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const todayStr = today();

  const loadKpis = useCallback(async () => {
    setLoadingKpis(true);
    try {
      const dates = getDateParams(dateRange);
      const [invRes, custRes, finRes] = await Promise.allSettled([
        gate(P.inventory, () => getInventoryStats(dates)),
        gate(P.customers, () => getCustomerKpis(dates)),
        gate(P.finance, () => getFinanceDashboard(dates)),
      ]);
      if (invRes.status === "fulfilled") setInventoryStats(invRes.value.data);
      if (custRes.status === "fulfilled") setCustomerKpis(custRes.value.data);
      if (finRes.status === "fulfilled") setFinanceData(finRes.value.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKpis(false);
    }
  }, [dateRange]);

  const loadTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const dates = getDateParams(dateRange);
      const [salesResChart, salesResTable, ordersRes, returnsRes] = await Promise.allSettled([
        gate(P.sales, () => getSales({ per_page: 100, sortBy: "created_at", sortDir: "desc", ...dates })), // For chart
        gate(P.sales, () => getSales({ per_page: 8, sortBy: "created_at", sortDir: "desc" })), // Always latest 8 for table
        gate(P.orders, () => getDeliverySchedules({ per_page: 6 })), // Recent orders
        gate(P.returns, () => getReturns({ status: "pending", per_page: 5 })),
      ]);
      
      if (salesResChart.status === "fulfilled") {
        const d = salesResChart.value.data;
        const arr = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        setRecentSalesFull(arr);
        if (d?.summary) setSalesData(d.summary);
      }
      
      if (salesResTable.status === "fulfilled") {
        const d = salesResTable.value.data;
        const arr = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        setRecentSalesTable(arr);
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
  }, [dateRange, todayStr]);

  useEffect(() => {
    loadKpis();
    loadTables();
  }, [loadKpis, loadTables]);

  const handleRefresh = () => {
    setLastRefresh(new Date());
    loadKpis();
    loadTables();
  };

  const recentSales = recentSalesTable.slice(0, 8);

  const financeSummary = financeData?.summary || {};
  const netProfit = financeSummary.net_profit ?? 0;
  const totalRevenue = financeSummary.total_revenue ?? 0;
  const totalExpenses = financeSummary.total_expenses ?? 0;
  const cashBalance = financeSummary.treasury?.cash_balance ?? 0;
  const bankBalance = financeSummary.treasury?.bank_balance ?? 0;

  // Chart 1: Tendencia de Ventas (AreaChart)
  const chartDataSales = useMemo(() => {
    if (!recentSalesFull || recentSalesFull.length === 0) return [];
    const grouped = {};
    recentSalesFull.forEach(s => {
      const d = s.created_at.split("T")[0];
      if (!grouped[d]) grouped[d] = 0;
      grouped[d] += Number(s.subtotal || s.total || 0);
    });
    return Object.keys(grouped).sort().map(date => ({
      date,
      ventas: grouped[date]
    }));
  }, [recentSalesFull]);

  // Chart 2: Origen de Fondos (BarChart)
  const chartDataFunds = useMemo(() => {
    const treasury = financeData?.summary?.treasury?.details || {};
    return [
      { name: "Banco", valor: treasury.bank?.sales || 0 },
      { name: "Caja", valor: treasury.cash?.sales || 0 },
      { name: "Giftcards", valor: treasury.giftcard?.sales || 0 },
    ];
  }, [financeData]);

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

  const getDeliveryTypeLabel = (type) => {
    if (type === 'home_delivery') return { label: "A Domicilio", cls: "type-home" };
    if (type === 'external') return { label: "Nacional", cls: "type-ext" };
    if (type === 'pickup') return { label: "Recojo", cls: "type-pickup" };
    return { label: "Punto Fijo", cls: "type-point" };
  };

  return (
    <div className="hd-container">

      <div className="hd-top">
        <div className="hd-greeting">
          <h1 className="hd-greeting-title">{greeting}, {userName} 👋</h1>
          <p className="hd-greeting-sub">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="hd-actions-group">
          <div className="hd-date-filter">
            <Calendar size={16} className="hd-filter-icon" />
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="hd-filter-select">
              <option value="today">Hoy</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="month">Este Mes</option>
              <option value="year">Este Año</option>
              <option value="all">Todo el Historial</option>
            </select>
          </div>
          <button className="hd-refresh-btn" onClick={handleRefresh} title="Actualizar datos">
            <RefreshCw size={16} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div className="hd-kpi-grid">
        {canAny(P.finance) && <KpiCard icon={TrendingUp} label="Ingresos totales" value={fmt(totalRevenue)} sub={`${fmtNum(salesData?.total_sales ?? 0)} transacciones`} color="kpi-green" loading={loadingKpis} /> }
        {canAny(P.finance) && <KpiCard icon={DollarSign} label="Ganancia neta" value={fmt(netProfit)} sub={`Gastos: ${fmt(totalExpenses)}`} color={netProfit >= 0 ? "kpi-blue" : "kpi-red"} loading={loadingKpis} /> }
        {canAny(P.inventory) && <KpiCard icon={Package} label="Unidades en stock" value={fmtNum(inventoryStats?.total_items)} sub={`Valor: ${fmt(inventoryStats?.total_retail_value)}`} color="kpi-purple" loading={loadingKpis} /> }
        {canAny(P.inventory) && <KpiCard icon={AlertTriangle} label="Alertas de stock" value={fmtNum(inventoryStats?.low_stock_alerts)} sub="Productos agotados o bajos" color={inventoryStats?.low_stock_alerts > 0 ? "kpi-orange" : "kpi-green"} loading={loadingKpis} /> }
        {canAny(P.customers) && <KpiCard icon={Users} label="Clientes totales" value={fmtNum(customerKpis?.total_customers)} sub={`${fmtNum(customerKpis?.new_this_month ?? 0)} nuevos`} color="kpi-teal" loading={loadingKpis} /> }
        {canAny(P.finance) && <KpiCard icon={CreditCard} label="Caja disponible" value={fmt(cashBalance)} sub={`Banco: ${fmt(bankBalance)}`} color="kpi-indigo" loading={loadingKpis} /> }
        {canAny(P.sales) && <KpiCard icon={ShoppingBag} label="Ticket promedio" value={fmt(salesData?.average_ticket)} sub="Por transacción" color="kpi-rose" loading={loadingKpis} /> }
        {canAny(P.sales) && <KpiCard icon={BarChart2} label="Descuentos dados" value={fmt(salesData?.total_discount)} sub="Total del período" color="kpi-amber" loading={loadingKpis} /> }
      </div>

      <div className="hd-charts-section">
        {canAny(P.sales) && (<div className="hd-chart-card">
          <h2 className="hd-chart-title">Tendencia de Ingresos</h2>
          <div className="hd-chart-wrapper">
            {loadingTables ? (
              <div className="hd-skeleton hd-skeleton-row" style={{height: '100%'}} />
            ) : chartDataSales.length === 0 ? (
              <p className="hd-empty">No hay suficientes datos para el gráfico.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartDataSales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--text-muted)'}} tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis tickFormatter={(v) => `Bs ${v}`} tick={{fontSize: 12, fill: 'var(--text-muted)'}} tickLine={false} axisLine={false} width={80} />
                  <RechartsTooltip 
                    formatter={(value) => [fmt(value), "Ventas"]} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div> )}

        {canAny(P.finance) && (<div className="hd-chart-card">
          <h2 className="hd-chart-title">Origen de Ingresos</h2>
          <div className="hd-chart-wrapper">
            {loadingKpis ? (
              <div className="hd-skeleton hd-skeleton-row" style={{height: '100%'}} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartDataFunds} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--text-muted)'}} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => `Bs ${v}`} tick={{fontSize: 12, fill: 'var(--text-muted)'}} tickLine={false} axisLine={false} width={80} />
                  <RechartsTooltip 
                    formatter={(value) => [fmt(value), "Monto"]} 
                    cursor={{fill: 'var(--bg-overlay)'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div> )}
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
          ].filter((m) => canAny(LINK_PERMS[m.to])).map(({ to, icon: Icon, label, sub, color }) => (
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

        {canAny(P.sales) && (<div className="hd-table-card">
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
                      
                    // FIX: If invoice_number is 'DLV-undefined' or null, just show the ID
                    let dispInv = s.invoice_number;
                    if (!dispInv || dispInv.includes('undefined')) dispInv = s.id?.slice(0, 8);
                    else dispInv = dispInv.slice(0, 12);
                      
                    return (
                      <tr key={s.id}>
                        <td className="hd-mono">{dispInv}</td>
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
        </div> )}

        {canAny(P.orders) && (<div className="hd-table-card">
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
                <thead><tr><th>ID</th><th>Tipo</th><th>Estado</th><th>Fecha</th></tr></thead>
                <tbody>
                  {pendingOrders.map((o) => {
                    const deliveryType = o.shipment?.delivery_type || 'scheduled_point';
                    const typeLabel = getDeliveryTypeLabel(deliveryType);
                    const dispCode = o.shipment?.delivery_code || o.id?.slice(0,8);
                    return (
                      <tr key={o.id}>
                        <td className="hd-mono">{dispCode}</td>
                        <td>
                          <span className={`hd-type-badge ${typeLabel.cls}`}>
                            {typeLabel.label}
                          </span>
                        </td>
                        <td><StatusBadge status={o.status} /></td>
                        <td className="hd-muted">{o.scheduled_date || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div> )}

        {canAny(P.returns) && (<div className="hd-table-card">
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
        </div> )}

      </div>

      <p className="hd-last-refresh">
        <Clock size={13} />
        Última actualización: {lastRefresh.toLocaleTimeString("es-ES")}
      </p>

    </div>
  );
}

