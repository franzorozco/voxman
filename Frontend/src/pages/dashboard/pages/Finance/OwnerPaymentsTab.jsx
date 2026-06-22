import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { getOwnerPayments, deleteOwnerPayment } from "../../../../api/admin/finance";
import OwnerPaymentModal from "./OwnerPaymentModal";

export default function OwnerPaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

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

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este movimiento?")) return;
    try {
      await deleteOwnerPayment(id);
      toast.success("Movimiento eliminado");
      fetchPayments();
    } catch (error) {
      toast.error("Error al eliminar movimiento");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                <th>Método</th>
                <th>Notas</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        <ArrowUpCircle size={14} /> Retiro
                      </span>
                    )}
                  </td>
                  <td data-label="Monto">
                    <span style={{ fontWeight: 'bold', color: p.type === 'deposit' ? '#22c55e' : '#eab308' }}>
                      {p.type === 'deposit' ? '+' : '-'} Bs. {Number(p.amount).toFixed(2)}
                    </span>
                  </td>
                  <td data-label="Método">
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.payment_method || 'N/A'}</span>
                    {p.reference_number && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ref: {p.reference_number}</div>}
                  </td>
                  <td data-label="Notas">
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.notes || '-'}</span>
                  </td>
                  <td data-label="Acciones">
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button 
                        className="btn-secondary"
                        onClick={() => { setSelectedPayment(p); setIsModalOpen(true); }}
                        title="Editar"
                        style={{ padding: '6px' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => handleDelete(p.id)}
                        title="Eliminar"
                        style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No hay movimientos registrados.
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
    </div>
  );
}
