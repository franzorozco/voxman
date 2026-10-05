import { useState, useEffect } from "react";
import { getFinanceDashboard, getOwnerLedger } from "../../../../api/admin/finance";
import { getBranches } from "../../../../api/admin/branches";
import { DollarSign, TrendingDown, TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, Activity, CreditCard, ChevronRight, History, DownloadCloud, Gift, Building, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import WithdrawModal from "./WithdrawModal";
import OwnerTransferModal from "./OwnerTransferModal";
import CanAccess from "../../../../components/ui/CanAccess";
import { useAuthStore } from "../../../../store/authStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { es } from "date-fns/locale";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function FinanceDashboard() {
  const [data, setDashboardData] = useState({ owners: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const user = useAuthStore((state) => state.user);
  
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // Modals state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawPaymentData, setWithdrawPaymentData] = useState(null);
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedBranchId, startDate, endDate]);

  useEffect(() => {
    if (selectedOwnerId) {
      fetchLedger(selectedOwnerId);
    } else {
      setLedgerData([]);
    }
  }, [selectedOwnerId, startDate, endDate]);

  const fetchBranches = async () => {
    try {
      const res = await getBranches();
      setBranches(res.data || res);
    } catch (error) {
      console.error("Error cargando sucursales", error);
    }
  };

  const fetchLedger = async (ownerId) => {
    try {
      setLoadingLedger(true);
      const params = {};
      if (startDate && endDate) {
        params.start_date = startDate.toISOString();
        params.end_date = endDate.toISOString();
      }
      const res = await getOwnerLedger(ownerId, params);
      setLedgerData(res.data);
    } catch (error) {
      toast.error("Error al cargar historial del socio");
    } finally {
      setLoadingLedger(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const params = { branch_id: selectedBranchId };
      if (startDate && endDate) {
        params.start_date = startDate.toISOString();
        params.end_date = endDate.toISOString();
      }
      const res = await getFinanceDashboard(params);
      setDashboardData(res.data);
    } catch (error) {
      toast.error("Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data.summary.total_revenue) {
    return <div className="loading-state">Cargando resumen financiero...</div>;
  }

  const { summary, owners } = data;
  const activeOwnerData = owners.find(o => o.owner_id === selectedOwnerId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER SECTION */}
      <div className="responsive-header" style={{ marginBottom: '10px' }}>
        <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
            Resumen General
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Control de ingresos, gastos y tesorerÃ­a en tiempo real.</p>
        </div>
        <div className="responsive-filters finance-filters">
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
            <CustomSelect 
              value={selectedBranchId} 
              onChange={(e) => setSelectedBranchId(e.target.value)} 
              className="form-control"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', minWidth: '200px' }}
            >
              <option value="all">Todas las Sucursales</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </CustomSelect>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="dashboard-summary-cards" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
  <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <TrendingUp size={16} color="var(--color-success)" />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingresos Brutos</span>
    </div>
    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {Number(summary.total_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
  </div>

  <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <TrendingDown size={16} color="var(--color-danger)" />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gastos Totales</span>
    </div>
    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {Number(summary.total_expenses || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
  </div>

  <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <DollarSign size={16} color="var(--color-primary)" />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ganancia Neta Global</span>
    </div>
    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {Number(summary.net_profit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
  </div>
</div>

      {/* TREASURY PANEL */}
      {summary.treasury && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
            <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
              <div style={{ background: 'var(--bg-overlay)', padding: '8px', borderRadius: '10px', color: 'var(--color-primary)', display: 'flex' }}>
                <Activity size={20} />
              </div>
              TesorerÃ­a Global de la Marca
            </h2>
            <p style={{ margin: '5px 0 0 46px', fontSize: '14px', color: 'var(--text-muted)' }}>Balance real de los fondos fÃ­sicos y digitales de la tienda.</p>
          </div>
          <div className="treasury-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', padding: '20px', background: 'transparent' }}>
  
  {/* CASH BALANCE */}
  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Wallet size={16} color="var(--color-success)" />
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Efectivo en Caja</span>
    </div>
    <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: 'var(--text-main)' }}>
      Bs. {Number(summary.treasury.cash_balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{color: 'var(--text-muted)'}}>Entradas:</span> 
        <span style={{color: 'var(--color-success)', fontWeight: 600}}>+{(Number(summary.treasury.details.cash.sales) + Number(summary.treasury.details.cash.deposits)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{color: 'var(--text-muted)'}}>Salidas:</span> 
        <span style={{color: 'var(--color-danger)', fontWeight: 600}}>-{(Number(summary.treasury.details.cash.expenses) + Number(summary.treasury.details.cash.withdrawals)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
      </div>
    </div>
  </div>

  {/* BANK BALANCE */}
  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <CreditCard size={16} color="var(--color-primary)" />
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cuenta Bancaria</span>
    </div>
    <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: 'var(--text-main)' }}>
      Bs. {Number(summary.treasury.bank_balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{color: 'var(--text-muted)'}}>Entradas:</span> 
        <span style={{color: 'var(--color-success)', fontWeight: 600}}>+{(Number(summary.treasury.details.bank.sales) + Number(summary.treasury.details.bank.deposits)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{color: 'var(--text-muted)'}}>Salidas:</span> 
        <span style={{color: 'var(--color-danger)', fontWeight: 600}}>-{(Number(summary.treasury.details.bank.expenses) + Number(summary.treasury.details.bank.withdrawals)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
      </div>
    </div>
  </div>

  {/* GIFTCARD BALANCE */}
  <div style={{ background: 'rgba(168, 85, 247, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Gift size={16} color="#a855f7" />
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ventas con Giftcard</span>
    </div>
    <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: 'var(--text-main)' }}>
      Bs. {Number(summary.treasury.details.giftcard?.sales || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
    </div>
    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', borderTop: '1px solid rgba(168, 85, 247, 0.2)', paddingTop: '10px', lineHeight: '1.4' }}>
      Suma a Ingresos Brutos, pero no inyecta dinero físico nuevo a las cajas.
    </div>
  </div>

</div>
</div>
)}

      {/* OWNERS BREAKDOWN */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', cursor: selectedOwnerId ? 'pointer' : 'default' }} onClick={() => setSelectedOwnerId(null)}>
            <Wallet size={20} style={{ color: 'var(--color-primary)' }}/>
            Billeteras de Socios {selectedOwnerId && <span style={{fontSize: '12px', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px', marginLeft: '10px', color: 'var(--text-muted)'}}>Volver a la vista general</span>}
          </h2>
        </div>
        
        {selectedOwnerId ? (
          <div className="owners-grid active">
            {/* LEFT PANE: List */}
            <div style={{ borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '15px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Seleccionar Socio
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {owners.map(o => (
                  <div 
                    key={o.owner_id}
                    onClick={() => setSelectedOwnerId(o.owner_id)}
                    style={{ 
                      padding: '16px 20px', 
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: selectedOwnerId === o.owner_id ? 'rgba(255,255,255,0.03)' : 'transparent',
                      borderLeft: selectedOwnerId === o.owner_id ? '3px solid var(--color-primary)' : '3px solid transparent',
                      color: selectedOwnerId === o.owner_id ? 'var(--text-main)' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontWeight: selectedOwnerId === o.owner_id ? 600 : 500, fontSize: '15px' }}>{o.name}</span>
                    {selectedOwnerId === o.owner_id && <ChevronRight size={16} style={{ color: 'var(--color-primary)' }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT PANE: Details Grid */}
            <div className="owner-detail-pane">
              {activeOwnerData && (
                <div className="fade-in">
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Reporte Financiero</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Detalle de movimientos, aportes y saldo disponible para <strong>{activeOwnerData.name}</strong>.</p>
                  </div>
                  
                  {/* MAIN BALANCE CARD */}
                  <div className="owner-details-header">
                    <div style={{ 
                      padding: '24px', 
                      background: activeOwnerData.current_balance >= 0 ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)', 
                      border: `1px solid ${activeOwnerData.current_balance >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, 
                      borderRadius: '16px', 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div>
                          <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Wallet size={16} /> Saldo Disponible Total
                          </p>
                          <h2 style={{ margin: 0, fontSize: '36px', color: activeOwnerData.current_balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>
                            Bs. {Number(activeOwnerData.current_balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </h2>
                        </div>
                      </div>
                      
                      {activeOwnerData.current_balance > 0 && user?.id === activeOwnerData.user_id && (
                        <CanAccess permission="manage_owner_payments">
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTransferData({
                                  owner_id: activeOwnerData.owner_id,
                                  branches: activeOwnerData.branches
                                });
                                setIsTransferModalOpen(true);
                              }}
                            >
                              <ArrowRight size={16} /> Transferir
                            </button>
                            <button 
                              className="btn-primary" 
                              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setWithdrawPaymentData({
                                  owner_id: activeOwnerData.owner_id,
                                  cash_balance: activeOwnerData.cash_balance,
                                  bank_balance: activeOwnerData.bank_balance,
                                  branches: activeOwnerData.branches
                                });
                                setIsWithdrawModalOpen(true);
                              }}
                            >
                              <DownloadCloud size={16} /> Retirar Fondos
                            </button>
                          </div>
                        </CanAccess>
                      )}
                    </div>
                    
                    <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Ganancia Neta (Actual):</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Bs. {Number(activeOwnerData.sales_revenue - activeOwnerData.expenses_assumed).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Deudas Pendientes:</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>Bs. {Number(activeOwnerData.pending_debts).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>ProyecciÃ³n (Restando Deudas):</span>
                        <span style={{ fontWeight: 700, color: (activeOwnerData.sales_revenue - activeOwnerData.expenses_assumed - activeOwnerData.pending_debts) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          Bs. {Number(activeOwnerData.sales_revenue - activeOwnerData.expenses_assumed - activeOwnerData.pending_debts).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BRANCH BALANCES */}
                  {activeOwnerData.branches && activeOwnerData.branches.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-main)', fontWeight: 600 }}>Desglose por Sucursal</h4>
                      <div className="branches-grid">
                        {activeOwnerData.branches.map(b => (
                          <div key={b.branch_id || 'global'} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Building size={14} style={{ color: 'var(--color-primary)' }} />
                              {b.branch_name}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ color: 'var(--text-muted)' }}>Caja FÃ­sica:</span>
                              <div style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                                Bs. {Number(b.cash_balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ color: 'var(--text-muted)' }}>Cta. Bancaria:</span>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Bs. {Number(b.bank_balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', gap: '8px', flexWrap: 'wrap', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Deuda Pendiente:</span>
                              <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>Bs. {Number(b.pending_debts).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ color: 'var(--text-muted)' }}>Ganancia Sucursal:</span>
                              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>Bs. {Number(b.sales_revenue - b.expenses_assumed).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* METRICS GRID */}
                  <div className="metrics-grid">
                    
                    <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--color-success)' }}>
                          <TrendingUp size={20} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Ingresos por Ventas</h4>
                      </div>
                      <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '24px' }}>Bs. {Number(activeOwnerData.sales_revenue).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>

                    <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: 'var(--color-danger)' }}>
                          <TrendingDown size={20} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Gastos Asumidos</h4>
                      </div>
                      <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '24px' }}>Bs. {Number(activeOwnerData.expenses_assumed).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>

                    <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: 'var(--bg-overlay)', borderRadius: '8px', color: 'var(--color-primary)' }}>
                          <ArrowUpCircle size={20} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Inyecciones</h4>
                      </div>
                      <div style={{ color: "var(--color-success)", fontWeight: 700, fontSize: "24px" }}>
                        Bs. {Number(activeOwnerData?.total_contributions || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>

                    <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: 'var(--color-warning)' }}>
                          <ArrowDownCircle size={20} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Retiros</h4>
                      </div>
                      <div style={{ color: "var(--color-danger)", fontWeight: 700, fontSize: "24px" }}>
                        Bs. {Number(activeOwnerData?.total_withdrawals || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>

                  {/* KARDEX SECTION */}
                  <div style={{ marginTop: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <History size={20} style={{ color: 'var(--color-primary)' }} />
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>Historial de Movimientos (Kardex)</h3>
                    </div>

                    {/* GrÃ¡fico de EvoluciÃ³n */}
                    {ledgerData.length > 0 && (
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: 'var(--text-main)' }}>EvoluciÃ³n del Capital</h3>
                        <div className="chart-scroll-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                          <div style={{ minWidth: '500px', height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={[...ledgerData].reverse()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="date" tickFormatter={(t) => new Date(t).toLocaleDateString()} stroke="var(--text-muted)" />
                                <YAxis stroke="var(--text-muted)" />
                                <RechartsTooltip labelFormatter={(t) => new Date(t).toLocaleDateString()} formatter={(value) => `Bs. ${value.toFixed(2)}`} contentStyle={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                                <Line type="monotone" dataKey="new_balance" name="Capital Disponible" stroke="var(--color-primary)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="ledger-table-container table-responsive" style={{ margin: 0 }}>
                      <table className="finance-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Sucursal</th>
                            <th>DescripciÃ³n</th>
                            <th>Tipo</th>
                            <th style={{ textAlign: 'right' }}>Monto (Bs)</th>
                            <th style={{ textAlign: 'right' }}>Saldo Ant. (Bs)</th>
                            <th style={{ textAlign: 'right' }}>Nuevo Saldo (Bs)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingLedger ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Cargando historial...</td></tr>
                          ) : ledgerData.length > 0 ? (
                            ledgerData.map((tx, idx) => (
                              <tr key={idx} style={{ background: tx.amount > 0 ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)' }}>
                                <td>{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td>{tx.branch_name || 'Global'}</td>
                                <td>{tx.description}</td>
                                <td>
                                  <span style={{ 
                                    padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                                    background: tx.type === 'deposit' ? 'rgba(16, 185, 129, 0.1)' : tx.type === 'withdrawal' ? 'rgba(245, 158, 11, 0.1)' : tx.type === 'sale' ? 'var(--bg-overlay)' : 'rgba(239, 68, 68, 0.1)',
                                    color: tx.type === 'deposit' ? 'var(--color-success)' : tx.type === 'withdrawal' ? 'var(--color-warning)' : tx.type === 'sale' ? 'var(--color-primary)' : 'var(--color-danger)'
                                  }}>
                                    {tx.type}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: tx.amount > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{Number(tx.previous_balance).toFixed(2)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>{Number(tx.new_balance).toFixed(2)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay movimientos registrados.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="table-container fade-in table-responsive" style={{ margin: 0, border: 'none', borderRadius: 0, overflowX: 'auto' }}>
            <table className="finance-table" style={{ border: 'none', borderRadius: 0, minWidth: '800px' }}>
              <thead>
                <tr>
                  <th>Socio</th>
                  <th>Ingresos por Ventas</th>
                  <th>Gastos Asumidos</th>
                  <th>Inyecciones</th>
                  <th>Retiros</th>
                  <th>Saldo Disponible</th>
                </tr>
              </thead>
              <tbody>
                {owners && owners.length > 0 ? owners.map(o => (
                  <tr key={o.owner_id} onClick={() => setSelectedOwnerId(o.owner_id)} style={{ cursor: 'pointer' }}>
                    <td data-label="Socio" style={{ fontWeight: 600 }}>{o.name}</td>
                    <td data-label="Ingresos por Ventas" style={{ color: 'var(--color-success)', fontWeight: 500 }}>+ Bs. {Number(o.sales_revenue).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td data-label="Gastos Asumidos" style={{ color: 'var(--color-danger)', fontWeight: 500 }}>- Bs. {Number(o.expenses_assumed).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td data-label="Inyecciones" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>+ Bs. {Number(o.deposits).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td data-label="Retiros" style={{ color: 'var(--color-warning)', fontWeight: 500 }}>- Bs. {Number(o.withdrawals).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td data-label="Saldo Disponible">
                      <span style={{ 
                        background: o.current_balance >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: o.current_balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        Bs. {Number(o.current_balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No hay datos de socios</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isWithdrawModalOpen && (
        <WithdrawModal
          isOpen={isWithdrawModalOpen}
          initialData={withdrawPaymentData}
          onClose={() => setIsWithdrawModalOpen(false)}
          onSuccess={() => {
            setIsWithdrawModalOpen(false);
            fetchDashboard();
            fetchLedger(selectedOwnerId);
          }}
        />
      )}

      {isTransferModalOpen && (
        <OwnerTransferModal
          transferData={transferData}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            fetchDashboard();
            fetchLedger(selectedOwnerId);
          }}
        />
      )}
      
    </div>
  );
}







