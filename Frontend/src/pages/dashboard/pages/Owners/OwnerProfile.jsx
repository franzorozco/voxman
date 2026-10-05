import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Package, TrendingUp, TrendingDown, DollarSign, PlusCircle, MinusCircle, UserCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getOwnerProfile } from "../../../../api/admin/owners";
import "../Finance/Finance.css"; // Reuse some KPI card styles

export default function OwnerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("kpis");

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
      <div className="owner-profile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <button 
            className="btn-back-responsive"
            onClick={() => navigate("/dashboard/owners")}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
            <UserCircle2 size={32} />
          </div>
          <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-main)', lineHeight: '1.2' }}>{fullName}</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', display: 'flex', flexWrap: 'wrap', gap: '4px 8px' }}>
              <span>{owner.user?.email}</span>
              <span>•</span>
              <span>{profile.phone || "Sin teléfono"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* KPIS */}
      <div className="owner-kpi-grid">
        
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <TrendingUp size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Liquidez Disponible (Caja Real)</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: kpis.available_liquidity >= 0 ? '#22c55e' : '#ef4444' }}>Bs. {kpis.available_liquidity.toFixed(2)}</p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Capital + Ganancia Neta</span>
            </div>
          </div>

          <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <Wallet size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Capital Invertido</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>Bs. {kpis.total_capital.toFixed(2)}</p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aportes Totales</span>
            </div>
          </div>
          
          <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <Package size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Valor del Inventario</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>Bs. {kpis.inventory_value.toFixed(2)}</p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{kpis.total_stock} uds. en stock</span>
            </div>
          </div>

          <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <TrendingUp size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Volumen Vendido</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>{kpis.items_sold} uds.</p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Productos comercializados</span>
            </div>
          </div>

          <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <DollarSign size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Rendimiento Neto</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: kpis.net_profit >= 0 ? '#22c55e' : '#ef4444' }}>
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
          <div className="branch-breakdown-grid">
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
      <div className="owner-tabs-container">
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
                      <td data-label="Fecha">{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td data-label="Tipo">
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
                      <td data-label="Monto" style={{ fontWeight: 600 }}>Bs. {(parseFloat(payment.amount) || parseFloat(payment.total_amount) || 0).toFixed(2)}</td>
                      <td data-label="Método">{payment.fund_source === 'cash' ? 'Caja Fuerte' : 'Banco'}</td>
                      <td data-label="Ref / Notas">
                        <div style={{ fontSize: '13px' }}>{payment.reference_number || '-'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{payment.notes}</div>
                      </td>
                      <td data-label="Estado">
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
                      <td data-label="Producto" style={{ fontWeight: 500 }}>{p.name}</td>
                      <td data-label="Variantes">{p.product_variants?.length || 0} variantes</td>
                      <td data-label="Precio Base">Bs. {parseFloat(p.base_price).toFixed(2)}</td>
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
    </div>
  );
}
