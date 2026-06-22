import { useState, useEffect } from "react";
import { getFinanceDashboard } from "../../../../api/admin/finance";
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { toast } from "react-hot-toast";

export default function FinanceDashboard() {
  const [data, setData] = useState({ owners: [], summary: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

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
      
      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Ingresos Brutos</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', color: 'var(--text-main)' }}>Bs. {Number(summary.total_revenue || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Gastos Operativos Totales</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', color: 'var(--text-main)' }}>Bs. {Number(summary.total_expenses || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Ganancia Neta Global</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', color: 'var(--text-main)' }}>Bs. {Number(summary.net_profit || 0).toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* OWNERS BREAKDOWN */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} style={{ color: 'var(--color-primary)' }}/>
            Billeteras de Socios
          </h2>
        </div>
        
        <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
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
                <tr key={o.owner_id}>
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
      </div>
      
    </div>
  );
}
