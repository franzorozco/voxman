import { useState, useEffect } from "react";
import { Building, Banknote, CreditCard, RefreshCw, ArrowRightLeft, PlusCircle, Unlock, Lock, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "react-hot-toast";
import { getCashFlow } from "../../../../../api/admin/finance";
import TransferModal from "./TransferModal";
import TreasuryAdjustmentModal from "./TreasuryAdjustmentModal";
import OpenRegisterModal from "./OpenRegisterModal";
import CloseRegisterModal from "./CloseRegisterModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { es } from "date-fns/locale";
import "./CashFlow.css";

export default function CashFlow() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isOpenRegisterModalOpen, setIsOpenRegisterModalOpen] = useState(false);
  const [isCloseRegisterModalOpen, setIsCloseRegisterModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate && endDate) {
        params.start_date = startDate.toISOString();
        params.end_date = endDate.toISOString();
      }
      const res = await getCashFlow(params);
      setData(res.data);
    } catch (error) {
      toast.error("Error al cargar flujo de sucursales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlow();
  }, [startDate, endDate]);

  const handleCloseModal = (wasUpdated) => {
    setIsTransferModalOpen(false);
    if (wasUpdated) {
      fetchCashFlow();
    }
  };

  const handleRegisterAction = (branch, action) => {
    setSelectedBranch(branch);
    if (action === 'open') {
        setIsOpenRegisterModalOpen(true);
    } else {
        setIsCloseRegisterModalOpen(true);
    }
  };

  if (loading && !data) {
    return <div className="loading-state">Calculando estados financieros...</div>;
  }

  const { bank_balance, branches, summary } = data || {};

  return (
    <div className="cashflow-container fade-in">
      <div className="cashflow-header">
        <div>
            <h1 className="cashflow-title">
            Flujo de Caja Operativo
            </h1>
            <p className="cashflow-subtitle">Control de efectivo por sucursales y cuenta bancaria global.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ zIndex: 10 }}>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                isClearable={true}
                locale={es}
                placeholderText="Filtrar por fechas..."
                className="form-control"
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <button 
                className="btn-primary" 
                onClick={() => setIsAdjustmentModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
            >
                <PlusCircle size={16} />
                Ajuste Extraordinario
            </button>
            <button 
                className="btn-primary" 
                onClick={() => setIsTransferModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <ArrowRightLeft size={16} />
                Transferir Fondos
            </button>
            <button 
                className="btn-secondary" 
                onClick={fetchCashFlow} 
                title="Actualizar saldos"
            >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      <h2 className="section-heading">
        <CreditCard size={20} />
        Cuenta Bancaria Central
      </h2>
      <div className="treasury-grid" style={{ marginBottom: '30px' }}>
        <div className="treasury-card treasury-bank" style={{ minHeight: '120px', background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(37,99,235,0.05) 100%)', backdropFilter: 'blur(10px)' }}>
          <CreditCard size={60} className="treasury-icon" style={{ opacity: 0.8 }} />
          <div className="treasury-label">Total Bancarizado (Tarjetas, QR, Transferencias)</div>
          <div className="treasury-balance" style={{ fontSize: '40px' }}>
            Bs. {Number(bank_balance || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} /> Flujo de Liquidez Diario (Runway)
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data?.daily_flow || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" tickFormatter={(t) => new Date(t).toLocaleDateString()} />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} labelFormatter={(t) => new Date(t).toLocaleDateString()} />
                <Legend />
                <Area type="monotone" dataKey="balance" name="Saldo Acumulado" stroke="#3b82f6" fillOpacity={0.3} fill="#3b82f6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', color: 'var(--text-main)' }}>Comparativa Efectivo por Sucursal (Ingresos vs Egresos)</h3>
          <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={branches || []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
              <Legend />
              <Bar dataKey="cash_sales" name="Ingresos (Ventas)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cash_expenses" name="Egresos (Gastos)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        </div>
      </div>

      <h2 className="section-heading">
        <Banknote size={20} />
        Efectivo en Cajas (Por Sucursal)
      </h2>
      
      <div className="wallets-grid">
        {branches?.map(branch => (
          <div key={branch.id} className="treasury-card treasury-cash" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(16,185,129,0.02) 100%)', backdropFilter: 'blur(10px)' }}>
            <Banknote size={40} className="treasury-icon" style={{ opacity: 0.8 }} />
            <div className="treasury-label">{branch.name}</div>
            <div className="treasury-balance">
              Bs. {Number(branch.cash_balance || 0).toFixed(2)}
            </div>
            
            <div className="treasury-stats" style={{ flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ventas al Contado:</span>
                    <span className="stat-value-pos">Bs. {Number(branch.cash_sales).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gastos Asignados:</span>
                    <span className="stat-value-neg">Bs. {Number(branch.cash_expenses).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Transferencias Netas:</span>
                    <span style={{ color: (branch.transfers_in - branch.transfers_out) >= 0 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                        {(branch.transfers_in - branch.transfers_out) >= 0 ? '+' : ''}
                        {Number(branch.transfers_in - branch.transfers_out).toFixed(2)}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '5px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {branch.is_register_open ? <Unlock size={14} color="#22c55e" /> : <Lock size={14} color="#ef4444" />}
                        Estado Caja:
                    </span>
                    <span style={{ fontWeight: 'bold', color: branch.is_register_open ? '#22c55e' : '#ef4444' }}>
                        {branch.is_register_open ? 'ABIERTA' : 'CERRADA'}
                    </span>
                </div>
            </div>
            
            <div style={{ marginTop: '16px' }}>
                {branch.is_register_open ? (
                    <button className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'transparent' }} onClick={() => handleRegisterAction(branch, 'close')}>
                        <Lock size={16} /> Cerrar Caja / Arqueo
                    </button>
                ) : (
                    <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#22c55e', borderColor: '#22c55e' }} onClick={() => handleRegisterAction(branch, 'open')}>
                        <Unlock size={16} /> Abrir Caja
                    </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* HISTORY TABLE */}
      <div style={{ marginTop: '50px' }}>
        <h2 className="section-heading">
          <Banknote size={20} />
          Historial de Movimientos (Kardex de Cajas)
        </h2>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 8px' }}>Fecha y Hora</th>
                <th style={{ padding: '12px 8px' }}>Tipo</th>
                <th style={{ padding: '12px 8px' }}>Sucursal</th>
                <th style={{ padding: '12px 8px' }}>Descripción</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Monto (Bs.)</th>
              </tr>
            </thead>
            <tbody>
              {data?.history && data.history.length > 0 ? (
                data.history.map(item => (
                  <tr key={item.id + item.type} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--text-main)', fontSize: '14px' }}>
                      {new Date(item.date).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '13px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: 'var(--bg-overlay)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)'
                      }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-main)', fontSize: '14px' }}>
                      {item.branch}
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      {item.description}
                    </td>
                    <td style={{ 
                      padding: '12px 8px', 
                      textAlign: 'right', 
                      fontWeight: 'bold',
                      color: item.is_positive === true ? '#10b981' : (item.is_positive === false ? '#ef4444' : 'var(--text-main)')
                    }}>
                      {item.is_positive === true ? '+' : (item.is_positive === false ? '-' : '')}
                      {Math.abs(item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay movimientos en este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isTransferModalOpen && (
        <TransferModal 
          branches={branches}
          bankBalance={bank_balance}
          onClose={handleCloseModal}
        />
      )}

      {isAdjustmentModalOpen && (
        <TreasuryAdjustmentModal 
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          onSuccess={fetchCashFlow}
          branches={branches?.filter(b => b.is_register_open) || []}
        />
      )}

      {isOpenRegisterModalOpen && (
        <OpenRegisterModal 
          isOpen={isOpenRegisterModalOpen}
          onClose={() => setIsOpenRegisterModalOpen(false)}
          onSuccess={fetchCashFlow}
          branch={selectedBranch}
        />
      )}

      {isCloseRegisterModalOpen && (
        <CloseRegisterModal 
          isOpen={isCloseRegisterModalOpen}
          onClose={() => setIsCloseRegisterModalOpen(false)}
          onSuccess={fetchCashFlow}
          branch={selectedBranch}
        />
      )}
    </div>
  );
}
