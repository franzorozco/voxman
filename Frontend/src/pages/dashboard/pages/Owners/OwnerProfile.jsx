import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Package, TrendingUp, TrendingDown, DollarSign, PlusCircle, MinusCircle, UserCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getOwnerProfile } from "../../../../api/admin/owners";
import OwnerPaymentModal from "../Finance/OwnerPaymentModal";
import "../Finance/Finance.css"; // Reuse some KPI card styles

export default function OwnerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("kpis");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState("deposit"); // 'deposit' or 'withdrawal'

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getOwnerProfile(id);
      setData(res.data);
    } catch (error) {
      toast.error("Error al cargar perfil del socio");
      navigate("/dashboard/owners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleOpenPayment = (type) => {
    setPaymentType(type);
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data || !data.owner) return null;

  const { owner, kpis, products } = data;
  const profile = owner.user?.profile || {};
  const fullName = `${profile.first_name || ""} ${profile.last_name_paternal || ""} ${profile.last_name_maternal || ""}`.trim();

  return (
    <div className="fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate("/dashboard/owners")}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <UserCircle2 size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-main)' }}>{fullName}</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
              {owner.user?.email} • {profile.phone || "Sin teléfono"}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            onClick={() => handleOpenPayment("withdrawal")}
          >
            <MinusCircle size={18} />
            Retirar Capital
          </button>
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#22c55e', borderColor: '#22c55e' }}
            onClick={() => handleOpenPayment("deposit")}
          >
            <PlusCircle size={18} />
            Inyectar Capital
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="kpi-row" style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        
        <div className="kpi-card" style={{ flex: '1 1 200px' }}>
          <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <TrendingUp size={24} />
          </div>
          <div className="kpi-info" style={{ flex: 1 }}>
            <h3>Liquidez Disponible (Caja Real)</h3>
            <p style={{ color: kpis.available_liquidity >= 0 ? '#22c55e' : '#ef4444' }}>Bs. {kpis.available_liquidity.toFixed(2)}</p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Capital + Ganancia Neta</span>
          </div>
        </div>

        <div className="kpi-card" style={{ flex: '1 1 200px' }}>
          <div className="kpi-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <Wallet size={24} />
          </div>
          <div className="kpi-info" style={{ flex: 1 }}>
            <h3>Capital Invertido</h3>
            <p>Bs. {kpis.total_capital.toFixed(2)}</p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aportes - Retiros</span>
          </div>
        </div>
        
        <div className="kpi-card" style={{ flex: '1 1 200px' }}>
          <div className="kpi-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            <Package size={24} />
          </div>
          <div className="kpi-info" style={{ flex: 1 }}>
            <h3>Valor del Inventario</h3>
            <p>Bs. {kpis.inventory_value.toFixed(2)}</p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{kpis.total_stock} uds. en stock</span>
          </div>
        </div>

        <div className="kpi-card" style={{ flex: '1 1 200px' }}>
          <div className="kpi-icon" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
            <TrendingUp size={24} />
          </div>
          <div className="kpi-info" style={{ flex: 1 }}>
            <h3>Volumen Vendido</h3>
            <p>{kpis.items_sold} uds.</p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Productos comercializados</span>
          </div>
        </div>

        <div className="kpi-card" style={{ flex: '1 1 200px' }}>
          <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <DollarSign size={24} />
          </div>
          <div className="kpi-info" style={{ flex: 1 }}>
            <h3>Rendimiento Neto</h3>
            <p style={{ color: kpis.net_profit >= 0 ? '#22c55e' : '#ef4444' }}>
              Bs. {kpis.net_profit.toFixed(2)}
            </p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ventas: {kpis.gross_sales.toFixed(2)} | Gastos: {kpis.assigned_expenses.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* BREAKDOWN BY BRANCH */}
      {data.fund_breakdown && data.fund_breakdown.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} /> Desglose de Liquidez y Rendimiento por Sucursal
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {data.fund_breakdown.map((b) => (
              <div key={b.branch_id} className="table-card" style={{ padding: '20px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  {b.branch_name}
                </h4>
                
                {/* CASH */}
                <div style={{ marginBottom: '16px', background: 'var(--bg-overlay)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Caja Física (Billetes)</span>
                    <span style={{ fontWeight: 'bold', color: b.cash.net_liquidity >= 0 ? '#22c55e' : '#ef4444' }}>
                      Bs. {b.cash.net_liquidity.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <span>Aportes: Bs. {b.cash.capital.toFixed(2)}</span>
                    <span>Ventas: Bs. {b.cash.sales.toFixed(2)}</span>
                    <span>Gastos: Bs. {b.cash.expenses.toFixed(2)}</span>
                  </div>
                </div>

                {/* BANK */}
                <div style={{ background: 'var(--bg-overlay)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Cuenta Bancaria</span>
                    <span style={{ fontWeight: 'bold', color: b.bank.net_liquidity >= 0 ? '#22c55e' : '#ef4444' }}>
                      Bs. {b.bank.net_liquidity.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <span>Aportes: Bs. {b.bank.capital.toFixed(2)}</span>
                    <span>Ventas: Bs. {b.bank.sales.toFixed(2)}</span>
                    <span>Gastos: Bs. {b.bank.expenses.toFixed(2)}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          style={{
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'kpis' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'kpis' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'kpis' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '15px'
          }}
          onClick={() => setActiveTab('kpis')}
        >
          Historial Financiero
        </button>
        <button
          style={{
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'products' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'products' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'products' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '15px'
          }}
          onClick={() => setActiveTab('products')}
        >
          Productos Asignados ({products.length})
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'kpis' && (
        <div className="table-card">
          <div className="table-header">
            <h3>Historial de Movimientos de Capital</h3>
          </div>
          <div className="table-responsive">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Ref / Notas</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {owner.owner_payments && owner.owner_payments.length > 0 ? (
                  owner.owner_payments.map(payment => (
                    <tr key={payment.id}>
                      <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td>
                        {payment.type === 'deposit' ? (
                          <span style={{ color: '#22c55e', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp size={14} /> Aporte
                          </span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingDown size={14} /> Retiro
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>Bs. {(parseFloat(payment.amount) || parseFloat(payment.total_amount) || 0).toFixed(2)}</td>
                      <td>{payment.fund_source === 'cash' ? 'Caja Fuerte' : 'Banco'}</td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{payment.reference_number || '-'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{payment.notes}</div>
                      </td>
                      <td>
                        <span style={{ background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: payment.status === 'paid' ? 'var(--color-success)' : 'var(--text-muted)' }}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No se encontraron movimientos financieros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="table-card">
          <div className="table-header">
            <h3>Catálogo Propio</h3>
          </div>
          <div className="table-responsive">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Variantes</th>
                  <th>Precio Base</th>
                </tr>
              </thead>
              <tbody>
                {products && products.length > 0 ? (
                  products.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td>{p.product_variants?.length || 0} variantes</td>
                      <td>Bs. {parseFloat(p.base_price).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Este socio no tiene productos asignados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <OwnerPaymentModal
          payment={null}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchProfile(); // Reload data
          }}
        />
      )}
    </div>
  );
}
