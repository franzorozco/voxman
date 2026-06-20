import { useState, useEffect } from "react";
import { X, FileText, User, Store, MapPin, CreditCard, RotateCcw, Truck, CheckCircle, Printer } from "lucide-react";
import { toast } from "react-hot-toast";
import { getSale, updateSaleStatus, cancelSale } from "../../../../api/admin/sales";
import Spinner from "../../components/Spinner/Spinner";
import ThermalReceiptModal from "./ThermalReceiptModal";

export default function SaleDetailsModal({ saleId, onClose }) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        const { data } = await getSale(saleId);
        setSale(data);
      } catch (error) {
        toast.error("Error al cargar los detalles de la venta");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [saleId, onClose]);

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`¿Estás seguro de cambiar el estado a ${newStatus}?`)) return;
    
    try {
      setActionLoading(true);
      const { data } = await updateSaleStatus(saleId, { status: newStatus });
      toast.success("Estado actualizado correctamente");
      setSale(data);
      // Actualizar los detalles
      const freshSale = await getSale(saleId);
      setSale(freshSale.data);
    } catch (error) {
      const msg = error.response?.data?.message || "Error al actualizar estado";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
        <Spinner size={40} color="var(--color-primary)" />
      </div>
    );
  }

  if (!sale) return null;

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
      <div className="modal-content fade-in" style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', width: '95%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} className="text-primary"/>
            Detalle de Venta: {sale.invoice_number || sale.id.split('-')[0]}
            <span className={`status-badge ${sale.status === 'completed' ? 'status-success' : sale.status === 'cancelled' ? 'status-danger' : 'status-warning'}`} style={{ marginLeft: '10px' }}>
              {sale.status}
            </span>
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Cliente Info */}
            <div className="sale-detail-section">
              <div className="sale-detail-title">
                <User size={18} /> Cliente
              </div>
              {sale.customer?.user?.profile ? (
                <div>
                  <div style={{ fontWeight: 600 }}>{sale.customer.user.profile.first_name} {sale.customer.user.profile.last_name_paternal}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>DNI/NIT: {sale.customer.tax_id || 'N/A'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email: {sale.customer.user.email}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Teléfono: {sale.customer.phone || 'N/A'}</div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Cliente Ocasional / Sin Registrar</div>
              )}
            </div>

            {/* Sucursal Info */}
            <div className="sale-detail-section">
              <div className="sale-detail-title">
                <Store size={18} /> Sucursal / Atendido por
              </div>
              {sale.branch && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600 }}>{sale.branch.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}><MapPin size={12} style={{display:'inline'}}/> {sale.branch.address}</div>
                </div>
              )}
              {sale.user?.profile && (
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Vendedor:</span>
                  <div style={{ fontWeight: 500 }}>{sale.user.profile.first_name} {sale.user.profile.last_name_paternal}</div>
                </div>
              )}
            </div>
          </div>

          {/* Detalles de los productos */}
          <div className="sale-detail-section">
            <div className="sale-detail-title">
              <FileText size={18} /> Productos
            </div>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="products-table" style={{ marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{textAlign: 'center'}}>Cant.</th>
                    <th style={{textAlign: 'right'}}>P. Unitario</th>
                    <th style={{textAlign: 'right'}}>Descuento</th>
                    <th style={{textAlign: 'right'}}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.sale_details && sale.sale_details.map((detail) => (
                    <tr key={detail.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {detail.giftcard ? `Giftcard ${detail.giftcard.code || ''}` : 
                           detail.bundle ? `Conjunto: ${detail.bundle.name}` :
                           (detail.product_variant?.product?.name || 'Producto Desconocido')}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {detail.giftcard ? 'Tarjeta de Regalo' : 
                           detail.bundle ? 'Conjunto Promocional' :
                           (detail.product_variant?.sku || '')}
                        </div>
                      </td>
                      <td style={{textAlign: 'center'}}>{detail.quantity}</td>
                      <td style={{textAlign: 'right'}}>Bs. {parseFloat(detail.unit_price).toFixed(2)}</td>
                      <td style={{textAlign: 'right', color: parseFloat(detail.discount) > 0 ? 'var(--status-danger)' : 'var(--text-muted)'}}>
                        {parseFloat(detail.discount) > 0 ? (
                          <>
                            <div style={{ fontWeight: 600 }}>-Bs. {parseFloat(detail.discount).toFixed(2)}</div>
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>
                              {sale.sale_applied_discounts?.find(d => d.sale_detail_id === detail.id)?.discount?.code 
                                ? `Promo: ${sale.sale_applied_discounts.find(d => d.sale_detail_id === detail.id).discount.code}`
                                : 'Manual'}
                            </div>
                          </>
                        ) : '-'}
                      </td>
                      <td style={{textAlign: 'right', fontWeight: 600}}>Bs. {parseFloat(detail.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                  {sale.giftcard_transactions && sale.giftcard_transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          Giftcard {transaction.giftcard?.code || ''}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Tarjeta de Regalo ({transaction.type === 'issue' ? 'Emisión' : transaction.type === 'reload' ? 'Recarga' : transaction.type})
                        </div>
                      </td>
                      <td style={{textAlign: 'center'}}>1</td>
                      <td style={{textAlign: 'right'}}>Bs. {parseFloat(transaction.amount).toFixed(2)}</td>
                      <td style={{textAlign: 'right', color: 'var(--text-muted)'}}>-</td>
                      <td style={{textAlign: 'right', fontWeight: 600}}>Bs. {parseFloat(transaction.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagos */}
          {sale.payments && sale.payments.length > 0 && (
            <div className="sale-detail-section">
              <div className="sale-detail-title">
                <CreditCard size={18} /> Pagos Realizados
              </div>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="products-table" style={{ marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th>Método</th>
                    <th style={{textAlign: 'center'}}>Referencia</th>
                    <th style={{textAlign: 'center'}}>Estado</th>
                    <th style={{textAlign: 'right'}}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{payment.payment_method?.name || 'Desconocido'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(payment.created_at).toLocaleString('es-ES')}
                        </div>
                      </td>
                      <td style={{textAlign: 'center'}}>{payment.transaction_reference || 'N/A'}</td>
                      <td style={{textAlign: 'center'}}>
                        <span className={`status-badge ${payment.status === 'completed' ? 'status-success' : payment.status === 'failed' ? 'status-danger' : 'status-warning'}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td style={{textAlign: 'right', fontWeight: 600}}>Bs. {parseFloat(payment.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {/* Envíos */}
          {sale.shipments && sale.shipments.length > 0 && (
            <div className="sale-detail-section">
              <div className="sale-detail-title">
                <Truck size={18} /> Envíos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {sale.shipments.map((shipment) => (
                  <div key={shipment.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 500 }}>Tracking: {shipment.tracking_code || 'N/A'}</div>
                      <span className={`status-badge ${shipment.status === 'delivered' ? 'status-success' : 'status-warning'}`}>
                        {shipment.status}
                      </span>
                    </div>
                    {shipment.address && (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }}/>
                        {shipment.address.street}, {shipment.address.city}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {sale.notes && (
            <div className="sale-detail-section" style={{ marginBottom: '20px' }}>
              <div className="sale-detail-title">
                <FileText size={18} /> Notas de la Venta
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '14px', color: 'var(--text-main)', marginTop: '10px' }}>
                {sale.notes}
              </div>
            </div>
          )}

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div className="sale-detail-section" style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                <span>Bs. {parseFloat(sale.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Descuento Global:</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--status-danger)' }}>- Bs. {parseFloat(sale.discount_total || 0).toFixed(2)}</span>
                  {parseFloat(sale.discount_total) > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {sale.sale_applied_discounts?.filter(d => !d.sale_detail_id).map(d => d.discount?.code).filter(Boolean).join(', ') 
                       ? `Cupones: ${sale.sale_applied_discounts.filter(d => !d.sale_detail_id).map(d => d.discount?.code).filter(Boolean).join(', ')}`
                       : 'Descuento Manual / Giftcard'}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid var(--border-color)' }}>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>TOTAL:</span>
                <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--color-primary)' }}>Bs. {parseFloat(sale.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-main)' }}>
          <div>
            {sale.status !== 'cancelled' && sale.status !== 'refunded' && (
              <button 
                className="btn-secondary" 
                style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
                onClick={() => handleStatusChange('cancelled')}
                disabled={actionLoading}
              >
                <RotateCcw size={16} /> Cancelar Venta
              </button>
            )}
            {sale.status === 'pending' && (
              <button 
                className="btn-primary" 
                style={{ marginLeft: '10px' }}
                onClick={() => handleStatusChange('completed')}
                disabled={actionLoading}
              >
                <CheckCircle size={16} /> Marcar Completada
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowReceipt(true)}>
              <Printer size={16} /> Imprimir Ticket
            </button>
            <button className="btn-secondary" onClick={onClose} disabled={actionLoading}>
              Cerrar
            </button>
          </div>
        </div>

      </div>

      {showReceipt && (
        <ThermalReceiptModal sale={sale} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}
