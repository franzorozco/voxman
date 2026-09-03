import { getImageUrl } from '../../../../utils/imageUtils';
import { useState, useEffect } from "react";
import { X, FileText, User, Store, MapPin, CreditCard, RotateCcw, Truck, CheckCircle, Printer, CalendarClock, StickyNote, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import { getSale, updateSaleStatus, cancelSale } from "../../../../api/admin/sales";
import Spinner from "../../components/Spinner/Spinner";
import ThermalReceiptModal from "./ThermalReceiptModal";
import SaleReturnModal from "./SaleReturnModal";
import CanAccess from "../../../../components/ui/CanAccess";
import { API_BASE_URL } from "../../../../config/api";

export default function SaleDetailsModal({ saleId, onClose }) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [returnDetail, setReturnDetail] = useState(null);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        const { data } = await getSale(saleId);
        setSale(data);
        setNotes(data.notes || "");
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

  const handleSaveNotes = async () => {
    try {
      setActionLoading(true);
      const { data } = await updateSaleStatus(saleId, { status: sale.status, notes: notes });
      toast.success("Notas guardadas correctamente");
      setSale(data);
      setIsEditingNotes(false);
    } catch (error) {
      const msg = error.response?.data?.message || "Error al guardar notas";
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
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', paddingRight: '50px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <FileText size={24} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }}/>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
              Detalle de Venta
              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '4px', wordBreak: 'break-all', fontWeight: 500 }}>
                {sale.invoice_number || sale.id.split('-')[0]}
              </div>
            </h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {sale.shipments?.[0]?.delivery_code && (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Entrega: {sale.shipments[0].delivery_code}</span>
            )}
            <span className={`status-badge ${sale.status === 'completed' ? 'status-success' : sale.status === 'cancelled' ? 'status-danger' : 'status-warning'}`}>
              {sale.status}
            </span>
            {sale.shipments?.[0]?.delivery_schedule && (
              <span className={`status-badge ${sale.shipments[0].delivery_schedule.status === 'completed' ? 'status-success' : 'status-warning'}`} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                Entrega: {sale.shipments[0].delivery_schedule.status === 'at_the_meeting_point' ? 'En el punto' : sale.shipments[0].delivery_schedule.status === 'on_the_way' ? 'En camino' : sale.shipments[0].delivery_schedule.status === 'completed' ? 'Completado' : sale.shipments[0].delivery_schedule.status === 'cancelled' ? 'Cancelado' : sale.shipments[0].delivery_schedule.status === 'pending' ? 'Pendiente' : sale.shipments[0].delivery_schedule.status === 'assigned' ? 'Asignado' : sale.shipments[0].delivery_schedule.status}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', position: 'absolute', top: '20px', right: '20px' }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {/* Cliente Info */}
            <div className="sale-detail-section">
              <div className="sale-detail-title">
                <User size={18} /> Cliente
              </div>
              {sale.customer ? (
                <div>
                  {sale.customer.user?.profile ? (
                    <>
                      <div style={{ fontWeight: 600 }}>{sale.customer.user.profile.first_name} {sale.customer.user.profile.last_name_paternal} <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 500, marginLeft: '8px' }}>• Cliente Web</span></div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Email: {sale.customer.user.email}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Teléfono: {sale.customer.user.profile.phone || 'N/A'}</div>
                    </>
                  ) : (sale.customer.pos_profile || sale.customer.posProfile) ? (
                    <>
                      <div style={{ fontWeight: 600 }}>{(sale.customer.pos_profile || sale.customer.posProfile).first_name} {(sale.customer.pos_profile || sale.customer.posProfile).last_name_paternal} <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 500, marginLeft: '8px' }}>• Cliente Caja (POS)</span></div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Teléfono: {(sale.customer.pos_profile || sale.customer.posProfile).phone || 'N/A'}</div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>Cliente sin perfil</div>
                  )}
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>DNI/NIT: {sale.customer.tax_id || 'N/A'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Código: {sale.customer.customer_code}</div>
                  
                  <CanAccess permission="view_loyalty_points">
                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={14} /> Puntos de Fidelidad
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '4px' }}>
                        Acumulados: <strong>{sale.customer.points || 0} pts</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Generados en esta venta: +{Math.floor(sale.total / 10)} pts
                      </div>
                    </div>
                  </CanAccess>
                </div>
              ) : sale.guest ? (
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {sale.guest.name}
                    <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600, background: 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>
                      • Entrega Agendada
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Teléfono: {sale.guest.whatsapp_phone || 'N/A'}</div>
                  {sale.guest.email && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email: {sale.guest.email}</div>}
                  {sale.guest.social_media_platform && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Contacto por: {sale.guest.social_media_platform}</div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Cliente Ocasional / Sin Registrar</div>
              )}
            </div>

            {/* Sucursal Info */}
            {sale.source !== 'order_network' && (
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
            )}

            {/* Lugar de Entrega Info */}
            {sale.shipments && sale.shipments.length > 0 && sale.shipments[0].delivery_schedule && (
              <div className="sale-detail-section">
                <div className="sale-detail-title">
                  <MapPin size={18} /> Lugar de Encuentro
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600 }}>{sale.shipments[0].delivery_schedule.meeting_point || 'Punto a convenir'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <CalendarClock size={12} /> {new Date(sale.shipments[0].delivery_schedule.scheduled_date + 'T00:00:00').toLocaleDateString('es-ES')} ({sale.shipments[0].delivery_schedule.time_window})
                  </div>
                </div>
                {sale.shipments[0].delivery_schedule.driver && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Repartidor asignado:</span>
                    <div style={{ fontWeight: 500 }}>
                      {sale.shipments[0].delivery_schedule.driver.user?.profile?.first_name} {sale.shipments[0].delivery_schedule.driver.user?.profile?.last_name_paternal}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detalles de los productos */}
          <div className="sale-detail-section">
            <div className="sale-detail-title">
              <FileText size={18} /> Productos
            </div>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="products-table" style={{ marginTop: '10px', minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{textAlign: 'center'}}>Cant.</th>
                    <th style={{textAlign: 'right'}}>P. Unitario</th>
                    <th style={{textAlign: 'right'}}>Descuento</th>
                    <th style={{textAlign: 'right'}}>Subtotal</th>
                    <th style={{textAlign: 'center'}}>Devolución</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.sale_details && sale.sale_details.map((detail) => {
                    const variant = detail.product_variant;
                    const product = variant?.product;
                    const colorId = variant?.variant_attribute_values?.[0]?.attribute_value_id;
                    const colorImg = product?.attribute_value_images?.find(img => img.attribute_value_id === colorId);
                    
                    let imageUrl = variant?.variant_images?.[0]?.url || colorImg?.url || product?.product_images?.find(img => img.is_main)?.url || product?.product_images?.[0]?.url;
                    
                    if (!imageUrl) {
                      const fallbackPath = variant?.variant_images?.[0]?.image_path || colorImg?.image_path || product?.product_images?.[0]?.image_path;
                      if (fallbackPath) {
                        imageUrl = `/storage/${fallbackPath}`;
                      }
                    }

                    if (!imageUrl.startsWith('http')) {
                      imageUrl = getImageUrl(imageUrl);
                    }

                    return (
                    <tr key={detail.id} style={{ opacity: detail.deleted_at ? 0.6 : 1, ...(detail.bundle_group_id ? { background: 'var(--bg-hover)' } : {}) }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {imageUrl && (
                            <img src={imageUrl} alt="Variant" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: detail.bundle_group_id ? '2px solid #f59e0b' : '1px solid var(--border-color)' }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 500, textDecoration: detail.deleted_at ? 'line-through' : 'none' }}>
                              {detail.giftcard ? `Giftcard ${detail.giftcard.code || ''}` : 
                              (variant?.product?.name || 'Producto Desconocido')}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {detail.giftcard ? 'Tarjeta de Regalo' : (variant?.sku || '')}
                              
                              {detail.bundle_group_id && (
                                <span style={{ color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                                  <Sparkles size={10} /> Ítem de Conjunto
                                </span>
                              )}

                              {!detail.giftcard && sale.stock_reservations && sale.stock_reservations.find(sr => sr.variant_id === detail.variant_id) && (
                                <span style={{ fontSize: '10px', background: 'var(--bg-body)', padding: '2px 6px', borderRadius: '4px' }}>
                                  Sucursal: {sale.stock_reservations.find(sr => sr.variant_id === detail.variant_id).branch?.name || 'Desconocida'}
                                </span>
                              )}
                              {detail.return_request && detail.return_request.status === 'pending' && (
                                <span style={{ fontSize: '10px', color: '#b45309', fontWeight: 600, background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                                  Devolución Solicitada
                                </span>
                              )}
                              {detail.return_request && detail.return_request.status === 'rejected' && (
                                <span style={{ fontSize: '10px', color: '#b91c1c', fontWeight: 600, background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                                  Devolución Rechazada
                                </span>
                              )}
                              {((detail.return_request && detail.return_request.status === 'approved') || (detail.deleted_at && !detail.return_request)) && (
                                <span style={{ fontSize: '10px', color: 'var(--color-danger)', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {detail.return_request ? 'Devuelto' : 'Quitado'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{textAlign: 'center', textDecoration: detail.deleted_at ? 'line-through' : 'none'}}>{detail.quantity}</td>
                      <td style={{textAlign: 'right', textDecoration: detail.deleted_at ? 'line-through' : 'none'}}>
                        {detail.bundle_group_id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              Bs. {parseFloat(detail.original_price || detail.unit_price).toFixed(2)}
                            </span>
                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                              Bs. {parseFloat(detail.unit_price).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          `Bs. ${parseFloat(detail.unit_price).toFixed(2)}`
                        )}
                      </td>
                      <td style={{textAlign: 'right', color: parseFloat(detail.discount || 0) > 0 ? 'var(--status-danger)' : 'var(--text-muted)', textDecoration: detail.deleted_at ? 'line-through' : 'none'}}>
                        {parseFloat(detail.discount || 0) > 0 ? (
                          <>
                            <div style={{ fontWeight: 600 }}>-Bs. {(parseFloat(detail.discount || 0) * detail.quantity).toFixed(2)}</div>
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>
                              {sale.sale_applied_discounts?.find(d => d.sale_detail_id === detail.id)?.discount?.code 
                                ? `Promo: ${sale.sale_applied_discounts.find(d => d.sale_detail_id === detail.id).discount.code}`
                                : 'Manual'}
                            </div>
                          </>
                        ) : '-'}
                      </td>
                      <td style={{textAlign: 'right', fontWeight: 600, textDecoration: detail.deleted_at ? 'line-through' : 'none'}}>Bs. {parseFloat(detail.subtotal).toFixed(2)}</td>
                      <td style={{textAlign: 'center'}}>
                        {detail.quantity > 0 && !detail.giftcard && !detail.deleted_at ? (
                          <CanAccess permission="create_returns" fallback={<span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>-</span>}>
                            <button
                              onClick={() => setReturnDetail(detail)}
                              style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}
                              title="Devolver este producto"
                            >
                              <RotateCcw size={12} />
                              Devolver
                            </button>
                          </CanAccess>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  )})}
                  {sale.giftcard_transactions && sale.giftcard_transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '40px', height: '40px', background: 'var(--bg-input)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CreditCard size={18} style={{ color: 'var(--text-muted)' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              Giftcard {transaction.giftcard?.code || ''}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Tarjeta de Regalo ({transaction.type === 'issue' ? 'Emisión' : transaction.type === 'reload' ? 'Recarga' : transaction.type})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{textAlign: 'center'}}>1</td>
                      <td style={{textAlign: 'right'}}>Bs. {parseFloat(transaction.amount).toFixed(2)}</td>
                      <td style={{textAlign: 'right', color: 'var(--text-muted)'}}>-</td>
                      <td style={{textAlign: 'right', fontWeight: 600}}>Bs. {parseFloat(transaction.amount).toFixed(2)}</td>
                      <td style={{textAlign: 'center'}}>-</td>
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
                <Truck size={18} /> Detalles de Entrega
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {sale.shipments.map((shipment) => (
                  <div key={shipment.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 500 }}>Código de Entrega: {shipment.delivery_code || 'N/A'} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '8px' }}>(Tracking: {shipment.tracking_code || 'N/A'})</span></div>
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
          <div className="sale-detail-section" style={{ marginBottom: '20px' }}>
            <div className="sale-detail-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><StickyNote size={18} style={{ flexShrink: 0 }} /> <span>Notas Internas de la Venta</span></div>
              {!isEditingNotes && (
                <CanAccess permission="edit_sale_notes">
                  <button onClick={() => setIsEditingNotes(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '13px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Editar Notas
                  </button>
                </CanAccess>
              )}
            </div>
            
            {isEditingNotes ? (
              <div style={{ marginTop: '10px' }}>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añade notas internas visibles solo para el personal..."
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', minHeight: '80px', color: 'var(--text-main)', resize: 'vertical', outline: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => { setIsEditingNotes(false); setNotes(sale.notes || ""); }} disabled={actionLoading} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={handleSaveNotes} disabled={actionLoading} style={{ padding: '6px 12px', background: 'var(--color-primary)', border: 'none', color: 'var(--color-primary-text)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                    {actionLoading ? 'Guardando...' : 'Guardar Notas'}
                  </button>
                </div>
              </div>
            ) : (
              sale.notes ? (
                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '14px', color: 'var(--text-main)', marginTop: '10px' }}>
                  {sale.notes}
                </div>
              ) : (
                <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic' }}>
                  No hay notas para esta venta. Haz clic en "Editar Notas" para agregar una.
                </div>
              )
            )}
          </div>

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div className="sale-detail-section" style={{ width: '100%', maxWidth: '300px', border: 'none', padding: '10px 0', background: 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                <span>Bs. {parseFloat(sale.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Descuento / Giftcard:</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--status-danger)' }}>- Bs. {parseFloat(sale.discount_total || 0).toFixed(2)}</span>
                  {parseFloat(sale.discount_total) > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                        {sale?.discount && (
                            <div style={{ marginBottom: '2px', fontWeight: 600 }}>Cupón aplicado: {sale.discount.code} ({sale.discount.name})</div>
                        )}
                        {sale?.giftcard_transactions?.map(tx => (
                            <div key={tx.id} style={{ marginBottom: '2px', fontWeight: 600 }}>Giftcard usada: {tx.giftcard?.code} (-Bs. {Number(tx.amount).toFixed(2)})</div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid var(--border-color)' }}>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>TOTAL:</span>
                <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--color-primary)' }}>Bs. {parseFloat(sale.subtotal - (sale.discount_total || 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="modal-footer" style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-main)' }}>
          
            {/* Primary Action */}
            <CanAccess permission="manage_sales">
              {sale.status === 'pending' && (
                <button 
                  style={{ backgroundColor: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', height: '44px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, width: '100%', fontSize: '14px', boxSizing: 'border-box' }}
                  onClick={() => handleStatusChange('completed')}
                  disabled={actionLoading}
                >
                  <CheckCircle size={18} /> Marcar Completada
                </button>
              )}
            </CanAccess>

            {/* Secondary Action */}
            <CanAccess permission="print_sale_receipt">
              <button style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', height: '44px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', boxSizing: 'border-box' }} onClick={() => setShowReceipt(true)}>
                <Printer size={18} /> Imprimir Ticket
              </button>
            </CanAccess>

            {/* Side-by-side actions */}
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <CanAccess permission="manage_sales">
                {sale.status !== 'cancelled' && sale.status !== 'refunded' && (
                  <button 
                    style={{ background: 'transparent', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid var(--color-danger)', height: '44px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1, fontSize: '14px', boxSizing: 'border-box' }}
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={actionLoading}
                  >
                    <X size={16} /> Cancelar
                  </button>
                )}
              </CanAccess>
              
              <button onClick={onClose} disabled={actionLoading} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', height: '44px', borderRadius: '8px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', boxSizing: 'border-box' }}>
                Cerrar
              </button>
            </div>
          
        </div>

      </div>

        {showReceipt && (
          <ThermalReceiptModal saleId={saleId} onClose={() => setShowReceipt(false)} />
        )}

        {returnDetail && (
          <SaleReturnModal 
            detail={returnDetail} 
            onClose={() => setReturnDetail(null)} 
            onReturnSuccess={() => {
              setReturnDetail(null);
            }} 
          />
        )}
    </div>
  );
}
