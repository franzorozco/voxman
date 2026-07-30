import { useState } from "react";
import { X, Undo2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { approveReturn, rejectReturn } from "../../../../api/admin/returns";
import CanAccess from "../../../../components/ui/CanAccess";
import "./Returns.css";

import CustomSelect from '../../../../components/ui/CustomSelect';
import { API_BASE_URL } from '../../../../config/api';

export default function ReturnDetailsModal({ returnItem, onClose }) {
  if (!returnItem) return null;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    refund_method: "cash",
    refund_amount: (returnItem.sale_detail?.final_price * returnItem.quantity) || 0,
    restock_destination: "inventory"
  });

  const handleApprove = async () => {
    if (!window.confirm("¿Estás seguro de aprobar esta devolución y reintegrar el stock?")) return;
    try {
      setLoading(true);
      await approveReturn(returnItem.id, formData);
      toast.success("Devolución aprobada y stock reintegrado");
      onClose(true); // pass true to trigger reload
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al aprobar devolución");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("¿Denegar permanentemente esta devolución?")) return;
    try {
      setLoading(true);
      await rejectReturn(returnItem.id);
      toast.success("Devolución rechazada");
      onClose(true);
    } catch (error) {
      toast.error("Error al rechazar devolución");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Undo2 className="text-primary" />
            Detalle de Devolución {returnItem.reference_number ? `(${returnItem.reference_number})` : ""}
          </h2>
          <button className="modal-close" onClick={() => onClose(false)}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', background: 'var(--bg-input)', padding: '16px', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cliente</div>
              <div style={{ fontWeight: 600 }}>{returnItem.sale_detail?.sale?.customer ? (returnItem.sale_detail.sale.customer.first_name + " " + returnItem.sale_detail.sale.customer.last_name) : "N/A"}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Venta Original</div>
              <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{returnItem.sale_detail?.sale?.invoice_number || "Ver Factura"}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Motivo del Cliente</div>
              <div style={{ fontWeight: 500, fontStyle: 'italic' }}>"{returnItem.reason || "Sin especificar"}"</div>
            </div>
          </div>

          <h3 style={{ marginBottom: '16px', fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Producto a Devolver</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            {returnItem.sale_detail?.product_variant?.product?.images?.[0] ? (
              <img 
                src={`${API_BASE_URL}/storage/${returnItem.sale_detail.product_variant.product.images[0].image_path}`} 
                alt="Producto" 
                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
              />
            ) : (
              <div style={{ width: '60px', height: '60px', background: 'var(--border-color)', borderRadius: '8px' }}></div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>{returnItem.sale_detail?.product_variant?.product?.name || "Desconocido"}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Talla: {returnItem.sale_detail?.product_variant?.size?.name || "N/A"} | 
                Fit: {returnItem.sale_detail?.product_variant?.fit?.name || "N/A"}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cant. a devolver</div>
              <div style={{ fontWeight: 700, fontSize: '18px' }}>x{returnItem.quantity}</div>
            </div>
          </div>

          {returnItem.status === 'pending' || returnItem.status === 'inspection' ? (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-main)' }}>Opciones de Resolución</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Destino Logístico (Restock)</label>
                  <CustomSelect 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                    value={formData.restock_destination}
                    onChange={(e) => setFormData({...formData, restock_destination: e.target.value})}
                  >
                    <option value="inventory">Devolver al Inventario Normal (Vender de nuevo)</option>
                    <option value="quarantine">Enviar a Cuarentena (Prenda defectuosa)</option>
                  </CustomSelect>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Método de Reembolso</label>
                    <CustomSelect 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                      value={formData.refund_method}
                      onChange={(e) => setFormData({...formData, refund_method: e.target.value})}
                    >
                      <option value="cash">Efectivo</option>
                      <option value="credit">Crédito en Tienda / Giftcard</option>
                      <option value="transfer">Transferencia / Tarjeta</option>
                    </CustomSelect>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Monto a Devolver (Bs.)</label>
                    <input 
                      type="number"
                      step="0.01"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                      value={formData.refund_amount}
                      onChange={(e) => setFormData({...formData, refund_amount: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <CanAccess permission="manage_returns">
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button 
                    onClick={handleReject} 
                    disabled={loading}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid #f44336', color: '#f44336', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                  >
                    <XCircle size={18} />
                    Denegar Devolución
                  </button>
                  <button 
                    onClick={handleApprove} 
                    disabled={loading}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#4caf50', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                  >
                    <CheckCircle size={18} />
                    Aprobar Devolución
                  </button>
                </div>
              </CanAccess>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-input)', borderRadius: '12px' }}>
              <div style={{ fontWeight: 600, fontSize: '16px', color: returnItem.status === 'approved' ? '#4caf50' : '#f44336' }}>
                {returnItem.status === 'approved' ? 'Devolución Aprobada' : 'Devolución Rechazada'}
              </div>
              {returnItem.status === 'approved' && (
                <div style={{ marginTop: '8px', fontSize: '14px' }}>
                  Se reembolsó <strong>Bs. {Number(returnItem.refund_amount).toFixed(2)}</strong> mediante <strong>{returnItem.refund_method}</strong>.<br/>
                  El producto se envió a: <strong>{returnItem.restock_destination === 'inventory' ? 'Inventario' : 'Cuarentena'}</strong>.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
