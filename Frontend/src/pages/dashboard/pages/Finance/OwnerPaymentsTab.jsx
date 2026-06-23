import { useState, useEffect } from "react";
import { Plus, Edit, Archive, XCircle, ArrowDownCircle, ArrowUpCircle, Eye, List, History } from "lucide-react";
import { toast } from "react-hot-toast";
import { getOwnerPayments, archiveOwnerPayment, annulOwnerPayment } from "../../../../api/admin/finance";
import OwnerPaymentModal from "./OwnerPaymentModal";
import OwnerPaymentDetailModal from "./OwnerPaymentDetailModal";

export default function OwnerPaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filterMode, setFilterMode] = useState('active'); // 'active' or 'history'

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await getOwnerPayments();
      setPayments(res.data);
    } catch (error) {
      toast.error("Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm("¿Estás seguro de archivar este movimiento? No se eliminará del Kardex, pero se ocultará de la vista principal.")) return;
    try {
      await archiveOwnerPayment(id);
      toast.success("Movimiento archivado");
      fetchPayments();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Error al archivar");
    }
  };

  const handleAnnul = async (id) => {
    if (!window.confirm("¿Estás seguro de anular este movimiento? Se invalidará esta transacción (solo posible dentro de las 24 horas).")) return;
    try {
      await annulOwnerPayment(id);
      toast.success("Movimiento anulado");
      fetchPayments();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Error al anular");
    }
  };

  const isRecent = (dateString) => {
    const diffHours = (new Date() - new Date(dateString)) / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  const filteredPayments = payments.filter(p => {
    if (filterMode === 'active') return p.status === 'paid';
    return p.status === 'archived' || p.status === 'annulled';
  });

  const calculateSummary = () => {
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    // Contar registros pagados y archivados para no descuadrar la contabilidad
    payments.forEach(p => {
      if (p.status === 'paid' || p.status === 'archived') {
        if (p.type === 'deposit') totalDeposits += Number(p.amount);
        if (p.type === 'withdrawal') totalWithdrawals += Number(p.amount);
      }
    });

    return { totalDeposits, totalWithdrawals, netBalance: totalDeposits - totalWithdrawals };
  };

  const summary = calculateSummary();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)' }}>
            <ArrowDownCircle size={20} />
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Total Inyectado</h3>
          </div>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>Bs. {summary.totalDeposits.toFixed(2)}</p>
        </div>
        
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)' }}>
            <ArrowUpCircle size={20} />
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Total Retirado</h3>
          </div>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>Bs. {summary.totalWithdrawals.toFixed(2)}</p>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
            <List size={20} />
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Balance Neto</h3>
          </div>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: summary.netBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {summary.netBalance >= 0 ? '+' : '-'} Bs. {Math.abs(summary.netBalance).toFixed(2)}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-overlay)', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setFilterMode('active')}
            style={{ 
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
              background: filterMode === 'active' ? 'var(--color-primary)' : 'transparent',
              color: filterMode === 'active' ? 'var(--color-primary-text)' : 'var(--text-main)'
            }}
          >
            <List size={16} /> Activos
          </button>
          <button
            onClick={() => setFilterMode('history')}
            style={{ 
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
              background: filterMode === 'history' ? 'var(--color-primary)' : 'transparent',
              color: filterMode === 'history' ? 'var(--color-primary-text)' : 'var(--text-main)'
            }}
          >
            <History size={16} /> Historial Anulados/Archivados
          </button>
        </div>

        <button 
          className="btn-primary" 
          onClick={() => { setSelectedPayment(null); setIsModalOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Nuevo Movimiento
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">Cargando movimientos...</div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Socio</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Cuenta</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr key={p.id} style={{ opacity: p.status === 'annulled' ? 0.6 : 1 }}>
                  <td data-label="Fecha">
                    <span style={{ fontWeight: 500 }}>{new Date(p.payment_date).toLocaleDateString()}</span>
                  </td>
                  <td data-label="Socio">
                    <span style={{ fontWeight: 600 }}>{p.owner?.user?.profile?.first_name} {p.owner?.user?.profile?.last_name_paternal}</span>
                  </td>
                  <td data-label="Tipo">
                    {p.type === 'deposit' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        <ArrowDownCircle size={14} /> Inyección
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        <ArrowUpCircle size={14} /> Retiro
                      </span>
                    )}
                  </td>
                  <td data-label="Monto">
                    <span style={{ fontWeight: 'bold', color: p.type === 'deposit' ? '#22c55e' : '#f59e0b' }}>
                      {p.type === 'deposit' ? '+' : '-'} Bs. {Number(p.amount).toFixed(2)}
                    </span>
                  </td>
                  <td data-label="Cuenta">
                    <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                      {p.fund_source === 'cash' ? 'Caja Física' : p.fund_source === 'bank' ? 'Cuenta Bancaria' : 'N/A'}
                    </span>
                  </td>
                  <td data-label="Estado">
                    <span style={{ 
                      background: p.status === 'paid' ? 'rgba(34, 197, 94, 0.1)' : p.status === 'annulled' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                      color: p.status === 'paid' ? '#22c55e' : p.status === 'annulled' ? '#64748b' : '#3b82f6', 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' 
                    }}>
                      {p.status === 'paid' ? 'Pagado' : p.status === 'annulled' ? 'Anulado' : 'Archivado'}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => { setSelectedPayment(p); setIsDetailModalOpen(true); }}
                        title="Ver Detalles"
                        style={{ padding: '6px', background: 'var(--bg-overlay)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Eye size={16} />
                      </button>

                      {p.status === 'paid' && (
                        <button 
                          className="btn-secondary"
                          onClick={() => { setSelectedPayment(p); setIsModalOpen(true); }}
                          title="Editar"
                          style={{ padding: '6px' }}
                        >
                          <Edit size={16} />
                        </button>
                      )}

                      {p.status === 'paid' && isRecent(p.created_at) && (
                        <button 
                          onClick={() => handleAnnul(p.id)}
                          title="Anular Movimiento (Revertir)"
                          style={{ padding: '6px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <XCircle size={16} />
                        </button>
                      )}

                      {p.status === 'paid' && !isRecent(p.created_at) && (
                        <button 
                          onClick={() => handleArchive(p.id)}
                          title="Archivar Movimiento (Ocultar)"
                          style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <Archive size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No hay movimientos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <OwnerPaymentModal 
          payment={selectedPayment}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPayments();
          }}
        />
      )}

      {isDetailModalOpen && selectedPayment && (
        <OwnerPaymentDetailModal 
          payment={selectedPayment}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
}
