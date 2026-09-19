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
      <div className="modal-content gift-modal-history">
        <div className="gift-modal-header gift-history-header">
          <div>
            <h2>Historial de Transacciones</h2>
            <div className="gift-history-subtitle">
              <span className="gift-code-text">
                {giftcard.code}
              </span>
              <span>Saldo Actual: <strong className="gift-text-primary">{formatCurrency(giftcard.current_balance)}</strong></span>
            </div>
            {(giftcard.purchaser || giftcard.customer) && (
              <div className="gift-history-owner">
                {giftcard.purchaser && <span><strong>Comprador original:</strong> {giftcard.purchaser.user?.profile?.first_name || 'Cliente'} {giftcard.purchaser.user?.profile?.last_name || ''}</span>}
                {giftcard.purchaser && giftcard.customer && <span className="divider">|</span>}
                {giftcard.customer && <span><strong>Propietario digital:</strong> {giftcard.customer.user?.profile?.first_name || 'Cliente'} {giftcard.customer.user?.profile?.last_name || ''}</span>}
              </div>
            )}
          </div>
          <button type="button" className="gift-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="gift-modal-body gift-history-body">
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
                  <div key={t.id} className="gift-timeline-item">
                    <div className="gift-timeline-icon-col">
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        background: `${getTypeColor(t.type)}20`, 
                        color: getTypeColor(t.type),
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <Activity size={16} />
                      </div>
                      {index !== giftcard.transactions.length - 1 && (
                        <div className="gift-timeline-line"></div>
                      )}
                    </div>
                    <div className="gift-timeline-content">
                      <div className="gift-timeline-header">
                        <strong style={{ color: getTypeColor(t.type) }}>{title}</strong>
                        <span style={{ fontWeight: 'bold', color: t.type === 'payment' || t.type === 'refund' && t.amount < 0 ? 'var(--danger-color)' : 'var(--text-main)' }}>
                          {t.type === 'payment' || (t.type === 'refund' && t.amount < 0) ? '-' : '+'}{formatCurrency(Math.abs(t.amount))}
                        </span>
                      </div>
                      <p className="gift-timeline-desc">
                        {description}
                      </p>
                      <div className="gift-timeline-meta">
                        <span className="gift-timeline-meta-item">
                          <Calendar size={12} /> {formatDate(t.created_at)}
                        </span>
                        {t.sale && (
                          <span className="gift-timeline-meta-item primary">
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
            <p className="gift-history-empty">
              No hay transacciones registradas para esta Giftcard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
