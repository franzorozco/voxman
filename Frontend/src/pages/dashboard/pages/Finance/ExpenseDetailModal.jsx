import { X, CheckCircle, Clock, Archive, XCircle } from "lucide-react";

export default function ExpenseDetailModal({ isOpen, onClose, expense }) {
  if (!isOpen || !expense) return null;

  const getSplitTypeLabel = (type) => {
    switch(type) {
      case 'equal': return 'División 50/50';
      case 'proportional': return 'Proporcional a ventas';
      case 'single_owner': return 'Un solo dueño';
      case 'custom': return 'Personalizado';
      default: return type;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'paid') return <span style={{ background: 'var(--bg-overlay)', color: 'var(--color-success)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>PAGADO</span>;
    if (status === 'annulled') return <span style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>ANULADO</span>;
    if (status === 'archived') return <span style={{ background: 'var(--bg-overlay)', color: 'var(--color-primary-text)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>ARCHIVADO</span>;
    return <span style={{ background: 'var(--bg-overlay)', color: 'var(--color-warning)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>PENDIENTE</span>;
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-content" style={{ background: 'var(--bg-card)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxWidth: '600px', width: '90%', padding: '24px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Detalles del Gasto
            {getStatusBadge(expense.status)}
          </h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Details */}
          <div style={{ background: 'var(--bg-overlay)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Concepto</p>
                <p style={{ margin: 0, fontWeight: 600 }}>{expense.name}</p>
                {expense.description && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{expense.description}</p>}
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Monto Total</p>
                <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-danger)', fontSize: '18px' }}>Bs. {Number(expense.amount).toFixed(2)}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Fecha Programada</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{new Date(expense.expense_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Categoría</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{expense.category || 'General'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Tipo de División</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{getSplitTypeLabel(expense.split_type)}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Recurrencia</p>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  {expense.is_recurring ? (
                    <span style={{ color: 'var(--color-primary-text)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> {expense.recurrence_interval === 'monthly' ? 'Mensual' : expense.recurrence_interval === 'weekly' ? 'Semanal' : 'Anual'}</span>
                  ) : 'Único'}
                </p>
              </div>
            </div>
          </div>

          {/* Splits Details */}
          <div>
            <h3 style={{ fontSize: '15px', margin: '0 0 10px 0' }}>Distribución y Estado de Pagos</h3>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ background: 'var(--bg-overlay)' }}>
                  <tr>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Socio</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>Porcentaje</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>Monto a Pagar</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Estado</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Fondo Usado</th>
                  </tr>
                </thead>
                <tbody>
                  {expense.expense_splits?.map((s, idx) => {
                    const ownerName = [s.owner?.user?.profile?.first_name, s.owner?.user?.profile?.last_name_paternal].filter(Boolean).join(' ') || 'Desconocido';
                    return (
                      <tr key={s.id} style={{ borderBottom: idx !== expense.expense_splits.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <td style={{ padding: '10px', fontWeight: 500 }}>{ownerName}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{Number(s.percentage).toFixed(0)}%</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Bs. {Number(s.amount).toFixed(2)}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {s.status === 'paid' ? <CheckCircle size={16} style={{ color: 'var(--color-success)', margin: 'auto' }}/> : 
                           s.status === 'annulled' ? <XCircle size={16} style={{ color: 'var(--text-muted)', margin: 'auto' }}/> : 
                           s.status === 'archived' ? <Archive size={16} style={{ color: 'var(--color-primary-text)', margin: 'auto' }}/> : 
                           <Clock size={16} style={{ color: 'var(--color-warning)', margin: 'auto' }}/>}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          {s.status === 'paid' || s.status === 'archived' ? (s.fund_source === 'cash' ? 'Caja' : s.fund_source === 'bank' ? 'Banco' : 'Caja (Legado)') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
