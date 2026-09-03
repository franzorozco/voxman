import { getImageUrl } from '../../../../utils/imageUtils';
import { X, Package, Edit, CheckCircle, Truck, Bell, Trash2, RefreshCw } from "lucide-react";
import "./Carts.css";
import { API_BASE_URL } from "../../../../config/api";
import CanAccess from "../../../../components/ui/CanAccess";

export default function CartDetailsModal({ cart, onClose, onEdit, onConvert, onConvertOrder, onReminder, onDelete, onRestore }) {
  if (!cart) return null;

  

  const getVariantImage = (variant) => {
    if (!variant) return null;
    
    // 1. Imagen unitaria de la variante
    if (variant.variant_images && variant.variant_images.length > 0) {
      return variant.variant_images[0].url;
    }
    
    // 2. Imagen por color (atributo)
    if (variant.variant_attribute_values?.length > 0 && variant.product?.attribute_value_images?.length > 0) {
      for (const vav of variant.variant_attribute_values) {
        const colorImage = variant.product.attribute_value_images.find(img => img.attribute_value_id === vav.attribute_value_id);
        if (colorImage) {
          return colorImage.url;
        }
      }
    }
    
    // 3. Fallback a imagen del producto
    if (variant.product?.product_images && variant.product.product_images.length > 0) {
      return variant.product.product_images[0].url;
    }
    
    return null;
  };

  const renderVariantAttributes = (variant) => {
    if (!variant) return null;
    
    // Si tiene atributos dinámicos, los usamos
    if (variant.variant_attribute_values && variant.variant_attribute_values.length > 0) {
      return variant.variant_attribute_values.map((vav, idx) => {
        const attrName = vav.attribute_value?.attribute?.name || "Atributo";
        const attrValue = vav.attribute_value?.value || "N/A";
        return (
          <div key={idx}>
            {attrName}: {attrValue}
          </div>
        );
      });
    }

    // Fallback a los atributos legacy (size_id, fit_id) si no hay dinámicos
    return (
      <>
        Talla: {variant.size?.name || "N/A"}<br />
        Color/Fit: {variant.fit?.name || "N/A"}
      </>
    );
  };

  const isActionable = cart.status === 'proforma' || cart.status === 'active';
  const isAbandoned = cart.status === 'abandoned';
  const isNotConverted = cart.status !== 'converted' && cart.status !== 'ordered';


  return (
    <div className="modal-overlay">
      <div className="modal-content cart-details-modal-container" style={{ width: '95%', maxWidth: '1100px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
              <Package className="text-primary" style={{ flexShrink: 0 }} />
              <span style={{ wordBreak: 'break-word' }}>{cart.reference_number || (
                cart.status === 'proforma' ? 'Proforma' : 
                cart.status === 'converted' ? 'Venta' : 'Carrito'
              )}</span>
            </h2>
            {cart.reference_number && (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', paddingLeft: '32px' }}>
                {cart.status === 'proforma' ? 'Detalles de la Proforma' : 
                 cart.status === 'converted' ? 'Detalles de la Venta' : 
                 'Detalles del Carrito'}
              </span>
            )}
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body-content">
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 calc(50% - 8px)', minWidth: '300px' }}>
              <div className="modal-info-grid" style={{ height: '100%', margin: 0 }}>
                <div>
                  <div className="modal-info-label">Cliente</div>
                  <div className="modal-info-value">
                    {cart.customer 
                      ? (cart.customer.user 
                          ? (cart.customer.user.profile?.first_name + " " + (cart.customer.user.profile?.last_name_paternal || "")) 
                          : (cart.customer.posProfile?.first_name + " " + (cart.customer.posProfile?.last_name_paternal || ""))) 
                      : "Usuario Anónimo"}
                  </div>
                </div>
                <div>
                  <div className="modal-info-label">Origen</div>
                  <div className="modal-info-value">{cart.source}</div>
                </div>
                <div>
                  <div className="modal-info-label">Estado</div>
                  <div className="modal-info-value">
                    {cart.status === 'active' && 'Carrito Web (Activo)'}
                    {cart.status === 'abandoned' && 'Abandonado'}
                    {cart.status === 'proforma' && 'Proforma (Manual)'}
                    {cart.status === 'converted' && 'Venta Concretada'}
                    {cart.status === 'ordered' && 'Convertido a Entrega'}
                  </div>
                </div>
                <div>
                  <div className="modal-info-label">Fecha de Creación</div>
                  <div className="font-semibold">{new Date(cart.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="modal-info-label">Fecha de Vencimiento</div>
                  <div className="font-semibold" style={{ color: cart.expires_at && new Date(cart.expires_at) < new Date() ? '#ef4444' : 'inherit' }}>
                    {cart.expires_at ? new Date(cart.expires_at).toLocaleString() : '-'}
                  </div>
                </div>
              </div>
            </div>

            {cart.delivery_details && (
              <div style={{ flex: '1 1 calc(50% - 8px)', minWidth: '300px' }}>
                <div style={{ height: '100%', padding: '16px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={16} className="text-primary" />
                    Información de Entrega
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div>
                      <div className="modal-info-label">Tipo</div>
                      <div className="modal-info-value">{cart.delivery_details.text || cart.delivery_details.type}</div>
                    </div>
                    
                    {cart.delivery_details.type === 'pickup' && (
                      <>
                        {cart.delivery_details.branch_name && <div><div className="modal-info-label">Sucursal</div><div className="modal-info-value">{cart.delivery_details.branch_name}</div></div>}
                        {cart.delivery_details.address && <div><div className="modal-info-label">Dirección</div><div className="modal-info-value">{cart.delivery_details.address}</div></div>}
                      </>
                    )}

                    {cart.delivery_details.type === 'meetup' && (
                      <>
                        {cart.delivery_details.city && <div><div className="modal-info-label">Ciudad</div><div className="modal-info-value">{cart.delivery_details.city}</div></div>}
                        {cart.delivery_details.zone_name && <div><div className="modal-info-label">Zona</div><div className="modal-info-value">{cart.delivery_details.zone_name}</div></div>}
                      </>
                    )}

                    {cart.delivery_details.type === 'delivery' && (
                      <>
                        {cart.delivery_details.city && <div><div className="modal-info-label">Ciudad</div><div className="modal-info-value">{cart.delivery_details.city}</div></div>}
                        {cart.delivery_details.zone && <div><div className="modal-info-label">Zona</div><div className="modal-info-value">{cart.delivery_details.zone}</div></div>}
                        {cart.delivery_details.street && <div><div className="modal-info-label">Calle</div><div className="modal-info-value">{cart.delivery_details.street}</div></div>}
                        {cart.delivery_details.reference && <div><div className="modal-info-label">Referencia</div><div className="modal-info-value">{cart.delivery_details.reference}</div></div>}
                        {cart.delivery_details.address && <div><div className="modal-info-label">Dirección</div><div className="modal-info-value">{cart.delivery_details.address}</div></div>}
                      </>
                    )}

                    {cart.delivery_details.type === 'national' && (
                      <>
                        {cart.delivery_details.destination && <div><div className="modal-info-label">Destino</div><div className="modal-info-value">{cart.delivery_details.destination}</div></div>}
                        {cart.delivery_details.company && <div><div className="modal-info-label">Agencia</div><div className="modal-info-value">{cart.delivery_details.company}</div></div>}
                        {cart.delivery_details.date && <div><div className="modal-info-label">Fecha de Envío</div><div className="modal-info-value">{cart.delivery_details.date}</div></div>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <h3 className="modal-section-title">Productos Seleccionados</h3>
          
          <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', paddingBottom: '12px' }}>
            <table className="products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Variante</th>
                  <th>Cantidad</th>
                  <th className="text-right">Precio Unit.</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cart.items && cart.items.length > 0 ? (
                  cart.items.map((item) => {
                    const availableStock = item.product_variant?.inventories?.reduce((sum, inv) => sum + Number(inv.stock), 0) || 0;
                    const isOutOfStock = availableStock < item.quantity;
                    
                    const isBundleItem = item.override_price !== null && item.override_price !== undefined;
                    const itemPrice = isBundleItem ? Number(item.override_price) : Number(item.product_variant?.price || 0);
                    const originalPrice = Number(item.original_price || item.product_variant?.price || 0);

                    return (
                    <tr key={item.id} style={isBundleItem ? { backgroundColor: 'var(--bg-hover)' } : {}}>
                      <td>
                        <div className="modal-product-cell">
                          {getVariantImage(item.product_variant) ? (
                            <img 
                              src={getImageUrl(getVariantImage(item.product_variant))} 
                              alt="product" 
                              className="modal-product-image"
                            />
                          ) : (
                            <div className="modal-product-placeholder"></div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="modal-product-name">{item.product_variant?.product?.name || "Desconocido"}</span>
                            {isBundleItem && (
                              <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '600', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', marginTop: '4px', border: '1px solid #fde68a' }}>
                                ✨ Ítem de Conjunto
                              </span>
                            )}
                            {isOutOfStock && cart.status !== 'converted' && (
                              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', marginTop: '4px' }}>
                                {availableStock === 0 ? 'Agotado' : `Stock Insuficiente (Hay ${availableStock})`}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="modal-variant-info">
                          {renderVariantAttributes(item.product_variant)}
                        </div>
                      </td>
                      <td className="font-semibold">{item.quantity}</td>
                      <td className="text-right">
                        {isBundleItem ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '12px' }}>
                              Bs. {originalPrice.toFixed(2)}
                            </span>
                            <span style={{ color: '#059669', fontWeight: 'bold' }}>
                              Bs. {itemPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span>Bs. {itemPrice.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="text-right font-semibold">Bs. {(itemPrice * item.quantity).toFixed(2)}</td>
                    </tr>
                  )})
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center modal-empty-state">No hay productos en este carrito</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className="text-right font-bold modal-footer-label">Total a Pagar:</td>
                  <td className="text-right font-bold modal-footer-value">
                    Bs. {Number(cart.total_amount_calculated).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions-bar">
            {onDelete && (
              <CanAccess permission="delete_carts">
                <button className="modal-action-btn modal-action-delete" onClick={() => { onClose(); onDelete(cart.id); }}>
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </button>
              </CanAccess>
            )}
            {isNotConverted && onEdit && (
              <CanAccess permission="edit_carts">
                <button className="modal-action-btn modal-action-edit" onClick={() => { onClose(); onEdit(cart); }}>
                  <Edit size={16} />
                  <span>Editar</span>
                </button>
              </CanAccess>
            )}
            {(isAbandoned || cart.status === 'active') && onReminder && (
              <CanAccess permission="send_cart_reminders">
                <button className="modal-action-btn modal-action-reminder" onClick={() => { onReminder(cart); }}>
                  <Bell size={16} />
                  <span>Enviar Recordatorio</span>
                </button>
              </CanAccess>
            )}
            {cart.expires_at && new Date(cart.expires_at) < new Date() && cart.status !== 'converted' && cart.status !== 'ordered' && onRestore && (
              <CanAccess permission="edit_carts">
                <button className="modal-action-btn modal-action-restore" onClick={() => { onClose(); onRestore(cart.id); }}>
                  <RefreshCw size={16} />
                  <span>Restaurar Carrito</span>
                </button>
              </CanAccess>
            )}
            {isActionable && onConvert && (
              <CanAccess permission="convert_carts">
                <button className="modal-action-btn modal-action-convert" onClick={() => { onClose(); onConvert(cart.id); }}>
                  <CheckCircle size={16} />
                  <span>Convertir a Venta</span>
                </button>
              </CanAccess>
            )}
            {isActionable && onConvertOrder && (
              <CanAccess permission="create_orders">
                <button className="modal-action-btn modal-action-order" onClick={() => { onClose(); onConvertOrder(cart.id); }}>
                  <Truck size={16} />
                  <span>Convertir a Entrega</span>
                </button>
              </CanAccess>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
