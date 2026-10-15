import { useState, useEffect } from "react";
import { FileText, TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon, RefreshCw, Building } from "lucide-react";
import { toast } from "react-hot-toast";
import { getFinanceReports } from "../../../../../api/admin/finance";
import { getBranches } from "../../../../../api/admin/branches";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { es } from "date-fns/locale";
import "./Reports.css";

import CustomSelect from '../../../../../components/ui/CustomSelect';
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

export default function FinanceReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await getBranches();
      // The API returns the response directly in 'res' because branches.js extracts 'data'
      setBranches(res.data || res);
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate && endDate) {
        params.start_date = startDate.toISOString();
        params.end_date = endDate.toISOString();
      }
      if (selectedBranch) {
        params.branch_id = selectedBranch;
      }
      const res = await getFinanceReports(params);
      setData(res.data);
    } catch (error) {
      toast.error("Error al cargar reportes contables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, selectedBranch]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-card)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "var(--text-main)" }}>{typeof label === "string" && label.includes("-") ? label.split("-").reverse().join("/") : label}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 'bold' }}>Bs. {Number(entry.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderGrowth = (value) => {
    if (value === undefined || value === null) return null;
    const isPositive = value >= 0;
    const color = isPositive ? '#22c55e' : '#ef4444';
    return (
      <span style={{ color, fontSize: '11px', fontWeight: '600', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
        {isPositive ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="finance-reports">
      <div className="reports-header">
        <div>
          <h1><FileText size={28} /> Reportes Contables</h1>
          <p>Métricas financieras, rentabilidad y análisis de flujo general.</p>
        </div>
        
        <div className="reports-filters" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
  <div style={{ width: isMobile ? '100%' : '200px' }}>
    <CustomSelect
      value={selectedBranch}
      onChange={(e) => setSelectedBranch(e.target.value)}
      style={{ width: '100%' }}
    >
      <option value="">Todas las Sucursales</option>
      {branches.map(b => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </CustomSelect>
  </div>
  
  <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
    <div className="date-picker-wrapper" style={{ flex: 1 }}>
      <CalendarIcon size={18} className="date-picker-icon" />
      <DatePicker
        selectsRange={true}
        startDate={startDate}
        endDate={endDate}
        onChange={(update) => setDateRange(update)}
        isClearable={true}
        placeholderText="Filtrar por fecha..."
        className="date-picker-input"
        locale={es}
        dateFormat="dd/MM/yyyy" wrapperClassName="w-full"
        style={{ width: '100%' }}
      />
    </div>
    <button className="btn-secondary" onClick={fetchReports} disabled={loading} style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: "auto" }}
      title="Actualizar datos"
    >
      <RefreshCw size={18} className={loading ? "spin" : ""} />
    </button>
  </div>
</div>
      </div>

      {loading && !data ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="reports-kpi-grid">
            <div className="reports-kpi-card kpi-sales">
              <div className="reports-kpi-top">
                <span className="reports-kpi-value">
                  Bs. {Number(data?.summary?.total_sales || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
                {renderGrowth(data?.summary?.growth?.sales)}
              </div>
              <div className="reports-kpi-bottom">
                <div className="reports-kpi-icon-mini">
                  <TrendingUp size={14} />
                </div>
                <span className="reports-kpi-label">Ventas Brutas</span>
              </div>
            </div>
            
            <div className="reports-kpi-card kpi-expenses">
              <div className="reports-kpi-top">
                <span className="reports-kpi-value">
                  Bs. {Number(data?.summary?.total_expenses || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
                {renderGrowth(data?.summary?.growth?.expenses)}
              </div>
              <div className="reports-kpi-bottom">
                <div className="reports-kpi-icon-mini">
                  <TrendingDown size={14} />
                </div>
                <span className="reports-kpi-label">Egresos y Gastos</span>
              </div>
            </div>

            <div className="reports-kpi-card kpi-profit">
              <div className="reports-kpi-top">
                <span className="reports-kpi-value" style={{ color: (data?.summary?.net_profit || 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  Bs. {Number(data?.summary?.net_profit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
                {renderGrowth(data?.summary?.growth?.profit)}
              </div>
              <div className="reports-kpi-bottom">
                <div className="reports-kpi-icon-mini">
                  <DollarSign size={14} />
                </div>
                <span className="reports-kpi-label">Utilidad Neta</span>
              </div>
            </div>

            <div className="reports-kpi-card kpi-margin">
              <div className="reports-kpi-top">
                <span className="reports-kpi-value">
                  {data?.summary?.total_sales > 0 ? ((data.summary.net_profit / data.summary.total_sales) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="reports-kpi-bottom">
                <div className="reports-kpi-icon-mini">
                  <FileText size={14} />
                </div>
                <span className="reports-kpi-label">Margen Neto</span>
              </div>
            </div>
          </div>

<div className="charts-grid">
            <div className="chart-card" style={{ marginBottom: 0 }}>
              <h3>Flujo Histórico (Ventas vs Egresos)</h3>
              <div className="chart-scroll-container">
                <div style={{ minWidth: isMobile ? '100%' : '550px', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.timeline || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickMargin={8} tickFormatter={(val) => val.includes("-") ? val.split("-").reverse().slice(0, 2).join("/") : val} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} width={55} tickFormatter={(val) => `Bs.${val}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="sales" name="Ventas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="chart-card" style={{ marginBottom: 0 }}>
              <h3>Distribución de Gastos</h3>
              <div className="chart-scroll-container">
                <div style={{ minWidth: '350px', height: 300 }}>
                {data?.expense_categories && data.expense_categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.expense_categories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.expense_categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    No hay gastos en este periodo
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3>Desglose por Día</h3>
            </div>
            <div className="table-responsive">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ventas Totales</th>
                    <th>Egresos / Gastos</th>
                    <th>Balance Diario (Utilidad)</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.timeline || []).slice().reverse().map((day, idx) => (
                    <tr key={idx}>
                      <td>{day.date.split("-").reverse().join("/")}</td>
                      <td style={{ color: '#22c55e', fontWeight: '500' }}>Bs. {Number(day.sales).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td style={{ color: '#ef4444', fontWeight: '500' }}>Bs. {Number(day.expenses).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td style={{ color: day.profit >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                        Bs. {Number(day.profit).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                  {(!data?.timeline || data.timeline.length === 0) && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No hay registros para este periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}








