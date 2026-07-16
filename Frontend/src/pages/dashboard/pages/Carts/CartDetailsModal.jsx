import { X, CheckCircle, Package } from "lucide-react";
import "./Carts.css";

export default function CartDetailsModal({ cart, onClose }) {
  if (!cart) return null;

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path.startsWith('/') ? '' : '/'}${path}`;
  };

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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            <Package className="text-primary" />
            {cart.status === 'proforma' ? 'Detalles de la Proforma ' : 
             cart.status === 'converted' ? 'Detalles de la Venta ' : 
             'Detalles del Carrito '} 
            {cart.reference_number ? `(${cart.reference_number})` : ""}
          </h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body-content">
          
          <div className="modal-info-grid">
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
              </div>
            </div>
            <div>
              <div className="modal-info-label">Fecha de Creación</div>
              <div className="font-semibold">{new Date(cart.created_at).toLocaleString()}</div>
            </div>
          </div>

          <h3 className="modal-section-title">Productos Seleccionados</h3>
          
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
                cart.items.map((item) => (
                  <tr key={item.id}>
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
                        <span className="modal-product-name">{item.product_variant?.product?.name || "Desconocido"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="modal-variant-info">
                        {renderVariantAttributes(item.product_variant)}
                      </div>
                    </td>
                    <td className="font-semibold">{item.quantity}</td>
                    <td className="text-right">Bs. {Number(item.product_variant?.price || 0).toFixed(2)}</td>
                    <td className="text-right font-semibold">Bs. {((item.product_variant?.price || 0) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))
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
      </div>
    </div>
  );
}
