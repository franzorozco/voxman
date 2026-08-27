import { getImageUrl } from '../../../../utils/imageUtils';
import React, { useState } from "react";
import { X, FileText, ShoppingCart, Info, MapPin, User, Hash, Printer, DollarSign, Plus } from "lucide-react";
import { API_BASE_URL } from "../../../../config/api";
import { registerPurchasePayment, updatePurchaseCosts } from "../../../../api/admin/purchases";
import { toast } from "react-hot-toast";

export default function ViewPurchaseModal({ purchase, onClose, onUpdate }) {
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [isAddingCost, setIsAddingCost] = useState(false);
  const [shippingCost, setShippingCost] = useState("");
  const [otherCost, setOtherCost] = useState("");
  const [submittingCost, setSubmittingCost] = useState(false);

  if (!purchase) return null;

  

  const extractImage = (item) => {
    const variant = item.product_variant;
    if (!variant) return null;

    // 1. Try variant exclusive image
    if (variant.variant_images?.[0]) {
      return getImageUrl(variant.variant_images[0].url);
    }

    // 2. Try shared color image
    const variantAttrIds = variant.variant_attribute_values?.map(v => String(v.attribute_value_id)) || [];
    const product = variant.product;
    if (product?.attribute_value_images) {
      const colorImg = product.attribute_value_images.find(img => variantAttrIds.includes(String(img.attribute_value_id)) && img.is_main) 
                    || product.attribute_value_images.find(img => variantAttrIds.includes(String(img.attribute_value_id)));
      if (colorImg) return getImageUrl(colorImg.url);
    }

    // 3. Try global product image
    const pImages = product?.product_images;
    if (pImages && pImages.length > 0) {
      const mainImg = pImages.find(img => img.is_main) || pImages[0];
      return getImageUrl(mainImg.url);
    }
    
    return null;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="status-badge status-pending">Pendiente</span>;
      case 'received': return <span className="status-badge status-received">Recepcionado</span>;
      case 'cancelled': return <span className="status-badge status-cancelled">Cancelado</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRegisterPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return toast.error("Ingresa un monto válido");
    try {
      setSubmittingPayment(true);
      await registerPurchasePayment(purchase.id, {
        amount: paymentAmount,
        notes: paymentNotes
      });
      toast.success("Pago registrado exitosamente");
      setIsAddingPayment(false);
      setPaymentAmount("");
      setPaymentNotes("");
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al registrar pago");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleUpdateCosts = async () => {
    try {
      setSubmittingCost(true);
      await updatePurchaseCosts(purchase.id, {
        shipping_cost: shippingCost || 0,
        other_costs: otherCost || 0
      });
      toast.success("Costos de importación actualizados");
      setIsAddingCost(false);
      setShippingCost("");
      setOtherCost("");
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar costos");
    } finally {
      setSubmittingCost(false);
    }
  };

  const account = purchase.accounts_payables?.[0];

  return (
    <div className="modal-overlay print-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "800px", width: "95%" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'space-between', paddingRight: '15px' }}>
          <h2 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--color-primary)" />
            Detalles de Compra
          </h2>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button onClick={handlePrint} className="btn-secondary" style={{ padding: '6px 12px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={16} /> <span className="hide-on-mobile">Imprimir</span>
            </button>
            <button onClick={onClose} className="modal-close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '50%', color: 'var(--text-muted)' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="purchase-detail-body">
          <div className="purchase-modal-info-grid">
            <div className="modal-info-item">
              <div className="modal-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Hash size={14} /> Nro Factura
              </div>
              <div className="modal-info-value">{purchase.invoice_number || "Sin factura"}</div>
            </div>
            
            <div className="modal-info-item">
              <div className="modal-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={14} /> Estado
              </div>
              <div className="modal-info-value" style={{ marginTop: '4px' }}>
                {getStatusBadge(purchase.status)}
              </div>
            </div>

            <div className="modal-info-item">
              <div className="modal-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} /> Proveedor
              </div>
              <div className="modal-info-value">{purchase.supplier?.name || "Desconocido"}</div>
            </div>

            <div className="modal-info-item">
              <div className="modal-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} /> Sucursal Destino
              </div>
              <div className="modal-info-value">{purchase.branch?.name || "No especificada"}</div>
            </div>

            <div className="modal-info-item">
              <div className="modal-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} /> Comprador / Empleado
              </div>
              <div className="modal-info-value">
                {purchase.employee?.user?.profile?.first_name || purchase.employee?.user?.user_profiles?.[0]?.first_name || "Desconocido"}
              </div>
            </div>

            <div className="modal-info-item">
              <div className="modal-info-label">Fecha de Emisión</div>
              <div className="modal-info-value">
                {new Date(purchase.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={16} color="var(--color-primary)" />
              Productos Solicitados
            </h3>
            
            <div className="table-container" style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table className="products-table" style={{ margin: 0, borderBottom: '1px solid var(--border-color)', borderRadius: 0, minWidth: '500px' }}>
                <thead>
                  <tr>
                    <th style={{ background: 'var(--bg-overlay)' }}>Producto</th>
                    <th style={{ background: 'var(--bg-overlay)' }}>SKU</th>
                    <th style={{ background: 'var(--bg-overlay)', textAlign: 'center' }}>Cant.</th>
                    <th style={{ background: 'var(--bg-overlay)', textAlign: 'right' }}>Costo Unit.</th>
                    <th style={{ background: 'var(--bg-overlay)', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.purchase_details?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {extractImage(item) ? (
                            <img src={extractImage(item)} alt="variant" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <div style={{ width: 30, height: 30, background: 'var(--bg-overlay)', borderRadius: '4px' }}></div>
                          )}
                          <span style={{ fontWeight: 500 }}>{item.product_variant?.product?.name || "Producto Desconocido"}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.product_variant?.sku || "-"}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>${Number(item.unit_cost).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                        ${Number(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {(!purchase.purchase_details || purchase.purchase_details.length === 0) && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay productos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <div className="modal-totals-section" style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                <span>Subtotal:</span>
                <span>${Number(purchase.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                <span>Impuestos:</span>
                <span>${Number(purchase.tax).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                <span>TOTAL:</span>
                <span>${Number(purchase.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {purchase.notes && (
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)' }}>Notas:</strong> 
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{purchase.notes}</pre>
            </div>
          )}

          {/* FINANCIAL SECTION */}
          {account && (
            <div className="no-print" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={16} color="var(--color-success)" />
                  Estado Financiero de la Orden
                </div>
                <span className={`status-badge status-${account.status === 'paid' ? 'success' : account.status === 'partial' ? 'warning' : 'danger'}`}>
                  {account.status === 'paid' ? 'Pagado' : account.status === 'partial' ? 'Pago Parcial' : 'Por Pagar'}
                </span>
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total a Pagar</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Bs. {Number(account.total_amount).toFixed(2)}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Pagado</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-success)' }}>Bs. {Number(account.paid_amount).toFixed(2)}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saldo Pendiente</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-danger)' }}>Bs. {Number(account.balance).toFixed(2)}</div>
                </div>
              </div>

                {purchase.supplier_payments && purchase.supplier_payments.length > 0 && (
                  <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Historial de Pagos</h4>
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead style={{ background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border-color)' }}>
                          <tr>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Fecha</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Método</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchase.supplier_payments.map(payment => (
                            <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--text-main)' }}>{new Date(payment.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-main)' }}>{payment.paymentMethod?.name || 'Manual'}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>Bs. {Number(payment.amount).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {account.balance > 0 && (
                <div style={{ marginTop: '10px' }}>
                  {!isAddingPayment ? (
                    <button style={{ background: 'var(--bg-overlay)', border: '1px dashed var(--border-color)', color: 'var(--text-main)', padding: '10px', width: '100%', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setIsAddingPayment(true)}>
                      <Plus size={16} /> Registrar Abono / Pago
                    </button>
                  ) : (
                    <div className="modal-payment-form" style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label>Monto a Pagar (Bs)</label>
                        <input type="number" className="purchase-form-input" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={account.balance} />
                      </div>
                      <div className="form-group" style={{ margin: 0, flex: 2 }}>
                        <label>Notas / Ref</label>
                        <input type="text" className="purchase-form-input" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="Nro de transferencia, etc..." />
                      </div>
                      <button className="btn-primary" onClick={handleRegisterPayment} disabled={submittingPayment}>
                        Guardar
                      </button>
                      <button className="btn-secondary" onClick={() => setIsAddingPayment(false)}>Cancelar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {purchase.status === 'pending' && (
            <div className="no-print" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="var(--color-warning)" /> Costos de Importación (Landed Cost)
              </h3>
              {!isAddingCost ? (
                <button style={{ background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--text-main)', padding: '10px', width: '100%', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setIsAddingCost(true)}>
                  <Plus size={16} /> Agregar Flete o Seguros
                </button>
              ) : (
                <div className="modal-payment-form">
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label>Flete (Bs)</label>
                    <input type="number" className="purchase-form-input" value={shippingCost} onChange={e => setShippingCost(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label>Otros Costos (Bs)</label>
                    <input type="number" className="purchase-form-input" value={otherCost} onChange={e => setOtherCost(e.target.value)} />
                  </div>
                  <button className="btn-primary" onClick={handleUpdateCosts} disabled={submittingCost}>Guardar</button>
                  <button className="btn-secondary" onClick={() => setIsAddingCost(false)}>Cancelar</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer no-print" style={{ marginTop: '30px', borderTop: 'none', display: 'flex', justifyContent: 'center' }}>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', padding: '10px 20px' }} onClick={onClose}>
            Cerrar Detalles
          </button>
        </div>
      </div>
    </div>
  );
}
