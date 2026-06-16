import React, { useEffect } from "react";
import { X, FileText, ShoppingCart, Info, MapPin, User, Hash } from "lucide-react";
import { API_BASE_URL } from "../../../../config/api";

export default function ViewPurchaseModal({ purchase, onClose }) {
  if (!purchase) return null;

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const finalPath = cleanUrl.startsWith('storage/') ? cleanUrl : `storage/${cleanUrl}`;
    
    return `${API_BASE_URL}/${finalPath}`;
  };

  const extractImage = (item) => {
    // Try variant image first
    const vImages = item.product_variant?.variant_images;
    if (vImages && vImages.length > 0) return getImageUrl(vImages[0].url);
    
    // Try product image fallback
    const pImages = item.product_variant?.product?.product_images;
    if (pImages && pImages.length > 0) return getImageUrl(pImages[0].url);
    
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

  return (
    <div className="purchase-detail-modal-overlay" onClick={onClose}>
      <div className="purchase-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="purchase-detail-header">
          <h2>
            <FileText size={20} color="var(--color-primary)" />
            Detalles de Orden de Compra
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        <div className="purchase-detail-body">
          <div className="purchase-info-grid">
            <div className="purchase-info-item">
              <div className="purchase-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Hash size={14} /> Nro Factura
              </div>
              <div className="purchase-info-value">{purchase.invoice_number || "Sin factura"}</div>
            </div>
            
            <div className="purchase-info-item">
              <div className="purchase-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={14} /> Estado
              </div>
              <div className="purchase-info-value" style={{ marginTop: '4px' }}>
                {getStatusBadge(purchase.status)}
              </div>
            </div>

            <div className="purchase-info-item">
              <div className="purchase-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} /> Proveedor
              </div>
              <div className="purchase-info-value">{purchase.supplier?.name || "Desconocido"}</div>
            </div>

            <div className="purchase-info-item">
              <div className="purchase-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} /> Sucursal Destino
              </div>
              <div className="purchase-info-value">{purchase.branch?.name || "No especificada"}</div>
            </div>

            <div className="purchase-info-item">
              <div className="purchase-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} /> Comprador / Empleado
              </div>
              <div className="purchase-info-value">
                {purchase.employee?.user?.user_profiles?.[0]?.first_name || "Desconocido"}
              </div>
            </div>

            <div className="purchase-info-item">
              <div className="purchase-info-label">Fecha de Emisión</div>
              <div className="purchase-info-value">
                {new Date(purchase.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={16} color="var(--color-primary)" />
              Productos Solicitados
            </h3>
            
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <table className="purchases-table" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: 'var(--bg-overlay)', padding: '16px', borderRadius: '8px', width: '250px', border: '1px solid var(--border-color)' }}>
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
              <strong style={{ color: 'var(--text-main)' }}>Notas:</strong> {purchase.notes}
            </div>
          )}
        </div>

        <div className="purchase-detail-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
