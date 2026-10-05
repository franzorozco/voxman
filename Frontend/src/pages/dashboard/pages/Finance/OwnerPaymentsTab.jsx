import { useState, useEffect } from "react";
import { Plus, Edit, Archive, XCircle, AlertCircle, ArrowDownCircle, ArrowUpCircle, Eye, List, History } from "lucide-react";
import { toast } from "react-hot-toast";
import { getOwnerPayments, archiveOwnerPayment, annulOwnerPayment } from "../../../../api/admin/finance";
import { getBranches } from "../../../../api/admin/branches";
import OwnerPaymentModal from "./OwnerPaymentModal";
import OwnerPaymentDetailModal from "./OwnerPaymentDetailModal";
import CanAccess from "../../../../components/ui/CanAccess";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function OwnerPaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filterMode, setFilterMode] = useState('active'); // 'active' or 'history'
  
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const res = await getBranches();
      setBranches(res.data || res);
    } catch (error) {
      console.error("Error al cargar sucursales", error);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await getOwnerPayments(selectedBranchId === 'all' ? {} : { branch_id: selectedBranchId });
      setPayments(res.data);
    } catch (error) {
      toast.error("Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Â¿EstÃ¡s seguro de archivar este movimiento? No se eliminarÃ¡ del Kardex, pero se ocultarÃ¡ de la vista principal.")) return;
    try {
      await archiveOwnerPayment(id);
      toast.success("Movimiento archivado");
      fetchPayments();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Error al archivar");
    }
  };

  const handleAnnul = async (id) => {
    if (!window.confirm("Â¿EstÃ¡s seguro de anular este movimiento? Se invalidarÃ¡ esta transacciÃ³n (solo posible dentro de las 24 horas).")) return;
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
      <div className="dashboard-summary-cards" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
  <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <ArrowDownCircle size={16} color="var(--color-success)" />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Inyectado</span>
    </div>
    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {summary.totalDeposits.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
  </div>
  
  <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <ArrowUpCircle size={16} color="var(--color-warning)" />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Retirado</span>
    </div>
    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {summary.totalWithdrawals.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
  </div>

  <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <List size={16} color="var(--color-primary)" />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance Neto</span>
    </div>
    <div style={{ fontSize: '24px', fontWeight: 700, color: summary.netBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
      {summary.netBalance >= 0 ? '+' : '-'} Bs. {Math.abs(summary.netBalance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
    </div>
  </div>
</div>
           {/* Action Bar */}
      <div className="responsive-header" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-overlay)', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setFilterMode('active')}
            style={{ 
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px',
              background: filterMode === 'active' ? 'var(--bg-card)' : 'transparent',
              color: filterMode === 'active' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: filterMode === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <List size={16} /> Movimientos Activos
          </button>
          <button 
            onClick={() => setFilterMode('history')}
            style={{ 
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px',
              background: filterMode === 'history' ? 'var(--bg-card)' : 'transparent',
              color: filterMode === 'history' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: filterMode === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <History size={16} /> Historial / Kardex
          </button>
        </div>

        <div className="responsive-filters" style={{ gap: '15px' }}>
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
          <CanAccess permission="manage_owner_payments">
            <button 
              className="btn-primary" 
              onClick={() => { setSelectedPayment(null); setIsModalOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} />
              Registrar Movimiento
            </button>
          </CanAccess>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">Cargando movimientos...</div>
        ) : (
          <div className="table-responsive">
          <table className="finance-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Sucursal</th>
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
                  <td data-label="Sucursal">
                    <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{p.branch?.name || 'Global'}</span>
                  </td>
                  <td data-label="Socio">
                    <span style={{ fontWeight: 600 }}>{p.owner?.user?.profile?.first_name} {p.owner?.user?.profile?.last_name_paternal}</span>
                  </td>
                  <td data-label="Tipo">
                    {p.type === 'deposit' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        <ArrowDownCircle size={14} /> InyecciÃ³n
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        <ArrowUpCircle size={14} /> Retiro
                      </span>
                    )}
                  </td>
                  <td data-label="Monto">
                    <span style={{ fontWeight: 'bold', color: p.type === 'deposit' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {p.type === 'deposit' ? '+' : '-'} Bs. {Number(p.amount).toFixed(2)}
                    </span>
                  </td>
                  <td data-label="Cuenta">
                    <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                      {p.fund_source === 'cash' ? 'Caja FÃ­sica' : p.fund_source === 'bank' ? 'Cuenta Bancaria' : 'N/A'}
                    </span>
                  </td>
                  <td data-label="Estado">
                    <span style={{ 
                      background: p.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : p.status === 'annulled' ? 'rgba(100, 116, 139, 0.1)' : 'var(--bg-overlay)', 
                      color: p.status === 'paid' ? 'var(--color-success)' : p.status === 'annulled' ? 'var(--text-muted)' : 'var(--color-primary)', 
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
                        <CanAccess permission="manage_owner_payments">
                          <button 
                            className="btn-secondary"
                            onClick={() => { setSelectedPayment(p); setIsModalOpen(true); }}
                            title="Editar"
                            style={{ padding: '6px' }}
                          >
                            <Edit size={16} />
                          </button>
                        </CanAccess>
                      )}

                      {p.status === 'paid' && isRecent(p.created_at) && (
                        <CanAccess permission="manage_owner_payments">
                          <button 
                            onClick={() => handleAnnul(p.id)}
                            title="Anular Movimiento (Revertir)"
                            style={{ padding: '6px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <XCircle size={16} />
                          </button>
                        </CanAccess>
                      )}

                      {p.status === 'paid' && !isRecent(p.created_at) && (
                        <button 
                          onClick={() => handleArchive(p.id)}
                          title="Archivar Movimiento (Ocultar)"
                          style={{ padding: '6px', background: 'var(--bg-overlay)', color: 'var(--color-primary)', border: '1px solid var(--bg-overlay)', borderRadius: '6px', cursor: 'pointer' }}
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
          </div>
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

