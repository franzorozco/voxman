import { X, ArrowUpCircle, ArrowDownCircle, Info, CalendarDays, History, Banknote } from "lucide-react";

export default function OwnerPaymentDetailModal({ payment, onClose }) {
  if (!payment) return null;

  return (
    <div className="modal-overlay fade-in">
      <div className="modal scale-in" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <h2 style={{ margin: 0, padding: 0, fontSize: '20px', border: 'none', background: 'none', WebkitTextFillColor: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {payment.type === 'deposit' ? <ArrowDownCircle size={22} color="var(--color-success)" /> : <ArrowUpCircle size={22} color="var(--color-warning)" />}
            Detalles del Movimiento
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'var(--bg-overlay)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}><Info size={14}/> Socio Responsable</div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)' }}>
                {payment.owner?.user?.profile?.first_name} {payment.owner?.user?.profile?.last_name_paternal}
              </div>
            </div>
            <div style={{ background: 'var(--bg-overlay)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}><Banknote size={14}/> Monto Total</div>
              <div style={{ fontWeight: 'bold', fontSize: '20px', color: payment.type === 'deposit' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {payment.type === 'deposit' ? '+' : '-'} Bs. {Number(payment.amount).toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo de Movimiento</label>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                  {payment.type === 'deposit' ? 'Inyección de Capital' : 'Retiro de Utilidades / Capital'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Origen / Destino</label>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                  {payment.fund_source === 'cash' ? 'Caja Física' : payment.fund_source === 'bank' ? 'Cuenta Bancaria' : 'N/A'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarDays size={14}/> Fecha de Movimiento</label>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                  {new Date(payment.payment_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</label>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ 
                    background: payment.status === 'paid' ? 'var(--bg-overlay)' : payment.status === 'annulled' ? 'var(--bg-overlay)' : 'var(--bg-overlay)', 
                    color: payment.status === 'paid' ? 'var(--color-success)' : payment.status === 'annulled' ? 'var(--color-danger)' : 'var(--color-primary)', 
                    padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase',
                    border: '1px solid var(--border-color)'
                  }}>
                    {payment.status === 'paid' ? 'Efectuado' : payment.status === 'annulled' ? 'Anulado' : 'Archivado'}
                  </span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Método de Pago</label>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                  {payment.payment_method || 'No especificado'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Número de Referencia</label>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                  {payment.reference_number || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notas y Detalles Adicionales</label>
            <div style={{ color: 'var(--text-main)', marginTop: '8px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {payment.notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin notas adicionales.</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px', borderTop: '1px dashed var(--border-color)', paddingTop: '15px' }}>
            <History size={14} /> Registrado el {new Date(payment.created_at).toLocaleString()}
          </div>
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
