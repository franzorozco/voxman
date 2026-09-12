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
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--text-main)' }}>{label}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 'bold' }}>Bs. {Number(entry.value).toFixed(2)}</span>
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
      <span style={{ color, fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {isPositive ? '↑' : '↓'} {Math.abs(value).toFixed(1)}% vs ant.
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
        
        <div className="reports-filters">
          <div className="date-picker-wrapper">
            <Building size={18} className="date-picker-icon" />
            <CustomSelect
              className="date-picker-input"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="">Todas las Sucursales</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </CustomSelect>
          </div>
          
          <div className="date-picker-wrapper">
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
              dateFormat="dd MMM yyyy"
            />
          </div>
          <button 
            className="btn-secondary" 
            onClick={fetchReports}
            disabled={loading}
            style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Actualizar datos"
          >
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                <TrendingUp size={24} />
              </div>
              <div className="kpi-info" style={{ flex: 1 }}>
                <h3>Ventas Brutas Totales</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', justifyContent: 'space-between' }}>
                  <p>Bs. {data?.summary?.total_sales?.toFixed(2) || '0.00'}</p>
                  {renderGrowth(data?.summary?.growth?.sales)}
                </div>
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <TrendingDown size={24} />
              </div>
              <div className="kpi-info" style={{ flex: 1 }}>
                <h3>Egresos y Gastos</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', justifyContent: 'space-between' }}>
                  <p>Bs. {data?.summary?.total_expenses?.toFixed(2) || '0.00'}</p>
                  {renderGrowth(data?.summary?.growth?.expenses)}
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <DollarSign size={24} />
              </div>
              <div className="kpi-info" style={{ flex: 1 }}>
                <h3>Utilidad Neta (Ingresos - Gastos)</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', justifyContent: 'space-between' }}>
                  <p style={{ color: (data?.summary?.net_profit || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                    Bs. {data?.summary?.net_profit?.toFixed(2) || '0.00'}
                  </p>
                  {renderGrowth(data?.summary?.growth?.profit)}
                </div>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card" style={{ marginBottom: 0 }}>
              <h3>Flujo Histórico (Ventas vs Egresos)</h3>
              <div className="chart-scroll-container">
                <div style={{ minWidth: '600px', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `Bs.${val}`} />
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
                      <td>{day.date}</td>
                      <td style={{ color: '#22c55e', fontWeight: '500' }}>Bs. {day.sales.toFixed(2)}</td>
                      <td style={{ color: '#ef4444', fontWeight: '500' }}>Bs. {day.expenses.toFixed(2)}</td>
                      <td style={{ color: day.profit >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                        Bs. {day.profit.toFixed(2)}
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
