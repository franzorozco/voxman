import { useState, useEffect } from "react";
import { getFinanceDashboard, getOwnerLedger } from "../../../../api/admin/finance";
import { DollarSign, TrendingDown, TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, Activity, CreditCard, ChevronRight, History, DownloadCloud, Gift } from "lucide-react";
import { toast } from "react-hot-toast";
import WithdrawModal from "./WithdrawModal";
import { useAuthStore } from "../../../../store/authStore";

export default function FinanceDashboard() {
  const [data, setData] = useState({ owners: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const user = useAuthStore((state) => state.user);
  
  // Modals state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawPaymentData, setWithdrawPaymentData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (selectedOwnerId) {
      fetchLedger(selectedOwnerId);
    } else {
      setLedger([]);
    }
  }, [selectedOwnerId]);

  const fetchLedger = async (ownerId) => {
    try {
      setLoadingLedger(true);
      const res = await getOwnerLedger(ownerId);
      setLedger(res.data);
    } catch (error) {
      toast.error("Error al cargar historial de movimientos");
    } finally {
      setLoadingLedger(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getFinanceDashboard();
      setData(res.data);
    } catch (error) {
      toast.error("Error al cargar dashboard de finanzas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Cargando resumen financiero...</div>;
  }

  const { summary, owners } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ marginBottom: '10px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', background: 'linear-gradient(90deg, var(--color-primary) 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Resumen General
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Control de ingresos, gastos y tesorería en tiempo real.</p>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.02) 100%)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', gap: '20px', backdropFilter: 'blur(10px)', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingresos Brutos</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '28px', color: 'var(--text-main)', fontWeight: 800 }}>Bs. {Number(summary.total_revenue || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.02) 100%)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '20px', backdropFilter: 'blur(10px)', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}>
            <TrendingDown size={28} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gastos Totales</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '28px', color: 'var(--text-main)', fontWeight: 800 }}>Bs. {Number(summary.total_expenses || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.02) 100%)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '20px', backdropFilter: 'blur(10px)', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ganancia Neta Global</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '28px', color: 'var(--text-main)', fontWeight: 800 }}>Bs. {Number(summary.net_profit || 0).toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* TREASURY PANEL */}
      {summary.treasury && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
            <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '10px', color: '#3b82f6', display: 'flex' }}>
                <Activity size={20} />
              </div>
              Tesorería Global de la Marca
            </h2>
            <p style={{ margin: '5px 0 0 46px', fontSize: '14px', color: 'var(--text-muted)' }}>Balance real de los fondos físicos y digitales de la tienda.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0' }}>
            
            {/* CASH BALANCE */}
            <div style={{ padding: '30px 40px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
              <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', color: '#22c55e', marginBottom: '20px', boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)' }}>
                <Wallet size={36} />
              </div>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Efectivo en Caja</h4>
              <h2 style={{ margin: '0 0 25px 0', fontSize: '38px', color: 'var(--text-main)', fontWeight: 800 }}>Bs. {Number(summary.treasury.cash_balance).toFixed(2)}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%', fontSize: '13px' }}>
                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Entradas</span>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '15px' }}>+{(Number(summary.treasury.details.cash.sales) + Number(summary.treasury.details.cash.deposits)).toFixed(2)}</div>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Salidas</span>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '15px' }}>-{(Number(summary.treasury.details.cash.expenses) + Number(summary.treasury.details.cash.withdrawals)).toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* BANK BALANCE */}
            <div style={{ padding: '30px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>
              <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: '#3b82f6', marginBottom: '20px', boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)' }}>
                <CreditCard size={36} />
              </div>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cuenta Bancaria</h4>
              <h2 style={{ margin: '0 0 25px 0', fontSize: '38px', color: 'var(--text-main)', fontWeight: 800 }}>Bs. {Number(summary.treasury.bank_balance).toFixed(2)}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%', fontSize: '13px' }}>
                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Entradas</span>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '15px' }}>+{(Number(summary.treasury.details.bank.sales) + Number(summary.treasury.details.bank.deposits)).toFixed(2)}</div>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Salidas</span>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '15px' }}>-{(Number(summary.treasury.details.bank.expenses) + Number(summary.treasury.details.bank.withdrawals)).toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* GIFTCARD "BALANCE" */}
            <div style={{ padding: '30px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(168, 85, 247, 0.02)' }}>
              <div style={{ padding: '16px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '50%', color: '#a855f7', marginBottom: '20px', boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)' }}>
                <Gift size={36} />
              </div>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ventas con Giftcard</h4>
              <h2 style={{ margin: '0 0 25px 0', fontSize: '38px', color: 'var(--text-main)', fontWeight: 800 }}>Bs. {Number(summary.treasury.details.giftcard?.sales || 0).toFixed(2)}</h2>
              <div style={{ width: '100%', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', background: 'var(--bg-main)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                Pagos recibidos mediante saldo de Giftcards. Suma a los <strong>Ingresos Brutos</strong>, pero no inyecta dinero físico nuevo a las cajas.
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
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '500px', background: 'var(--bg-main)' }}>
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
                    onMouseEnter={(e) => {
                      if (selectedOwnerId !== o.owner_id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedOwnerId !== o.owner_id) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }
                    }}
                  >
                    <span style={{ fontWeight: selectedOwnerId === o.owner_id ? 600 : 500, fontSize: '15px' }}>{o.name}</span>
                    {selectedOwnerId === o.owner_id && <ChevronRight size={16} style={{ color: 'var(--color-primary)' }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT PANE: Details Grid */}
            <div style={{ padding: '30px 40px', background: 'transparent' }}>
              {owners.filter(o => o.owner_id === selectedOwnerId).map(o => (
                <div key={o.owner_id} className="fade-in">
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Reporte Financiero</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Detalle de movimientos, aportes y saldo disponible para <strong>{o.name}</strong>.</p>
                  </div>
                  
                  {/* MAIN BALANCE CARD */}
                  <div style={{ 
                    padding: '24px', 
                    background: o.current_balance >= 0 ? 'rgba(34, 197, 94, 0.04)' : 'rgba(239, 68, 68, 0.04)', 
                    border: `1px solid ${o.current_balance >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, 
                    borderRadius: '16px', 
                    marginBottom: '24px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div>
                        <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Wallet size={16} /> Saldo Disponible Total
                        </p>
                        <h2 style={{ margin: 0, fontSize: '36px', color: o.current_balance >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                          Bs. {Number(o.current_balance).toFixed(2)}
                        </h2>
                      </div>
                      
                      {o.current_balance > 0 && user?.id === o.user_id && (
                        <button 
                          className="btn-primary" 
                          style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setWithdrawPaymentData({
                              owner_id: o.owner_id,
                              cash_balance: o.cash_balance,
                              bank_balance: o.bank_balance
                            });
                            setIsWithdrawModalOpen(true);
                          }}
                        >
                          <DownloadCloud size={16} /> Retirar Fondos
                        </button>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: 'var(--bg-main)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ padding: '10px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                          <Wallet size={12}/> Caja Física
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>Bs. {Number(o.cash_balance).toFixed(2)}</div>
                      </div>
                      <div style={{ padding: '10px', borderLeft: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                          <CreditCard size={12}/> Cuenta Bancaria
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>Bs. {Number(o.bank_balance).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* METRICS GRID */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    
                    {/* Revenue Card */}
                    <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', color: '#22c55e' }}>
                          <TrendingUp size={20} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Ingresos por Ventas</h4>
                      </div>
                      <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '24px' }}>Bs. {Number(o.sales_revenue).toFixed(2)}</span>
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Ganancias generadas por productos vendidos del socio.</p>
                    </div>

                    {/* Expenses Card */}
                    <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444' }}>
                          <TrendingDown size={20} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Gastos Asumidos</h4>
                      </div>
                      <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '24px' }}>Bs. {Number(o.expenses_assumed).toFixed(2)}</span>
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Costos operativos descontados al socio.</p>
                    </div>

                    {/* Injections Card */}
                    <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6' }}>
                          <ArrowUpCircle size={20} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Inyecciones</h4>
                      </div>
                      <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '24px' }}>Bs. {Number(o.deposits).toFixed(2)}</span>
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Capital aportado directamente por el socio.</p>
                    </div>

                    {/* Withdrawals Card */}
                    <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px', color: '#eab308' }}>
                          <ArrowDownCircle size={20} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Retiros</h4>
                      </div>
                      <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '24px' }}>Bs. {Number(o.withdrawals).toFixed(2)}</span>
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Capital retirado de la cuenta del socio.</p>
                    </div>

                  </div>

                  {/* KARDEX / LEDGER SECTION */}
                  <div style={{ marginTop: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <History size={20} style={{ color: 'var(--color-primary)' }} />
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>Historial de Movimientos (Kardex)</h3>
                    </div>

                    <div className="table-container" style={{ margin: 0 }}>
                      <table className="products-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th>Tipo</th>
                            <th style={{ textAlign: 'right' }}>Monto (Bs)</th>
                            <th style={{ textAlign: 'right' }}>Saldo Ant. (Bs)</th>
                            <th style={{ textAlign: 'right' }}>Nuevo Saldo (Bs)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingLedger ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Cargando historial...</td>
                            </tr>
                          ) : ledger.length > 0 ? (
                            ledger.map((tx, idx) => (
                              <tr key={idx}>
                                <td>{new Date(tx.date).toLocaleString()}</td>
                                <td>{tx.description}</td>
                                <td>
                                  <span style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: tx.type === 'sale' ? 'rgba(34, 197, 94, 0.1)' : 
                                                tx.type === 'expense' ? 'rgba(239, 68, 68, 0.1)' :
                                                tx.type === 'deposit' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                    color: tx.type === 'sale' ? '#22c55e' : 
                                           tx.type === 'expense' ? '#ef4444' :
                                           tx.type === 'deposit' ? '#3b82f6' : '#eab308'
                                  }}>
                                    {tx.type === 'sale' ? 'Venta' : 
                                     tx.type === 'expense' ? 'Gasto' : 
                                     tx.type === 'deposit' ? 'Inyección' : 'Retiro'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: tx.amount >= 0 ? '#22c55e' : '#ef4444' }}>
                                  {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                  {Number(tx.previous_balance).toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                  {Number(tx.new_balance).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No hay movimientos registrados.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="table-container fade-in" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
            <table className="products-table" style={{ border: 'none', borderRadius: 0 }}>
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
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td style={{ color: '#22c55e', fontWeight: 500 }}>+ Bs. {Number(o.sales_revenue).toFixed(2)}</td>
                    <td style={{ color: '#ef4444', fontWeight: 500 }}>- Bs. {Number(o.expenses_assumed).toFixed(2)}</td>
                    <td style={{ color: '#3b82f6', fontWeight: 500 }}>+ Bs. {Number(o.deposits).toFixed(2)}</td>
                    <td style={{ color: '#eab308', fontWeight: 500 }}>- Bs. {Number(o.withdrawals).toFixed(2)}</td>
                    <td>
                      <span style={{ 
                        background: o.current_balance >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: o.current_balance >= 0 ? '#22c55e' : '#ef4444',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        Bs. {Number(o.current_balance).toFixed(2)}
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
          onClose={() => {
            setIsWithdrawModalOpen(false);
            setWithdrawPaymentData(null);
          }}
          onSuccess={() => {
            fetchDashboard();
            if (selectedOwnerId) fetchLedger(selectedOwnerId);
          }}
        />
      )}
      
    </div>
  );
}
