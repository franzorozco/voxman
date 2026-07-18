import { X, Calendar, DollarSign, Activity } from "lucide-react";
import "./Giftcards.css";

export default function GiftcardHistoryModal({ isOpen, onClose, giftcard }) {
  if (!isOpen || !giftcard) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-BO');
  };

  const translateType = (type) => {
    const types = {
      'issue': 'Emisión',
      'reload': 'Recarga',
      'payment': 'Pago',
      'refund': 'Reembolso'
    };
    return types[type] || type;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'issue': return '#3b82f6'; // blue
      case 'reload': return '#10b981'; // green
      case 'payment': return '#ef4444'; // red
      case 'refund': return '#8b5cf6'; // purple
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content giftcard-history-modal" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="modal-header" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h2 style={{ marginBottom: '8px' }}>Historial de Transacciones</h2>
            <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                {giftcard.code}
              </span>
              <span>Saldo Actual: <strong style={{ color: 'var(--primary-color)' }}>{formatCurrency(giftcard.current_balance)}</strong></span>
            </div>
            {(giftcard.purchaser || giftcard.customer) && (
              <div style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-muted)' }}>
                {giftcard.purchaser && <span><strong>Comprador original:</strong> {giftcard.purchaser.user?.profile?.first_name || 'Cliente'} {giftcard.purchaser.user?.profile?.last_name || ''}</span>}
                {giftcard.purchaser && giftcard.customer && <span style={{ margin: '0 8px' }}>|</span>}
                {giftcard.customer && <span><strong>Propietario digital:</strong> {giftcard.customer.user?.profile?.first_name || 'Cliente'} {giftcard.customer.user?.profile?.last_name || ''}</span>}
              </div>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto', padding: '20px 0' }}>
          {giftcard.transactions && giftcard.transactions.length > 0 ? (
            <div className="timeline">
              {giftcard.transactions.map((t, index) => {
                let title = translateType(t.type);
                let description = t.notes || "Sin descripción adicional";

                if (t.type === 'issue') {
                    if (giftcard.purchaser) {
                        description = `Adquirida originalmente por ${giftcard.purchaser.user?.profile?.first_name || ''} ${giftcard.purchaser.user?.profile?.last_name || ''}. ${t.notes || ''}`;
                    } else {
                        description = `Emisión de tarjeta anónima. ${t.notes || ''}`;
                    }
                } else if (t.type === 'payment') {
                    if (t.sale) {
                        description = `Descuento automático por pago en la Factura/Venta #${t.sale.invoice_number || t.sale.id}. ${t.notes || ''}`;
                    } else {
                        description = `Pago realizado. ${t.notes || ''}`;
                    }
                } else if (t.type === 'reload') {
                    description = `Aumento de saldo manual. ${t.notes || ''}`;
                } else if (t.type === 'refund') {
                    description = `Devolución o anulación procesada. ${t.notes || ''}`;
                }

                return (
                  <div key={t.id} style={{ display: 'flex', gap: '16px', marginBottom: '20px', padding: '0 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        background: `${getTypeColor(t.type)}20`, 
                        color: getTypeColor(t.type),
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <Activity size={16} />
                      </div>
                      {index !== giftcard.transactions.length - 1 && (
                        <div style={{ width: '2px', height: '100%', background: 'var(--border-color)', margin: '4px 0' }}></div>
                      )}
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-overlay)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: getTypeColor(t.type) }}>{title}</strong>
                        <span style={{ fontWeight: 'bold', color: t.type === 'payment' || t.type === 'refund' && t.amount < 0 ? 'var(--danger-color)' : 'var(--text-main)' }}>
                          {t.type === 'payment' || (t.type === 'refund' && t.amount < 0) ? '-' : '+'}{formatCurrency(Math.abs(t.amount))}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-main)', fontSize: '13px', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                        {description}
                      </p>
                      <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} /> {formatDate(t.created_at)}
                        </span>
                        {t.sale && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-color)', fontWeight: 500 }}>
                            <DollarSign size={12} /> Venta #{t.sale.invoice_number || t.sale.id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              No hay transacciones registradas para esta Giftcard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
