import { X, CheckCircle, Package } from "lucide-react";
import "./Carts.css";

export default function CartDetailsModal({ cart, onClose }) {
  if (!cart) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package className="text-primary" />
            Detalles del Carrito {cart.reference_number ? `(${cart.reference_number})` : ""}
          </h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', background: 'var(--bg-input)', padding: '16px', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cliente</div>
              <div style={{ fontWeight: 600 }}>{cart.user ? (cart.user.profile?.first_name + " " + cart.user.profile?.last_name) : "Usuario Anónimo"}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Origen</div>
              <div style={{ textTransform: 'capitalize', fontWeight: 600 }}>{cart.source}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estado</div>
              <div style={{ textTransform: 'capitalize', fontWeight: 600 }}>{cart.status}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fecha de Creación</div>
              <div style={{ fontWeight: 600 }}>{new Date(cart.created_at).toLocaleString()}</div>
            </div>
          </div>

          <h3 style={{ marginBottom: '16px', fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Productos Seleccionados</h3>
          
          <table className="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Variante</th>
                <th>Cantidad</th>
                <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.items && cart.items.length > 0 ? (
                cart.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.product_variant?.product?.images?.[0] ? (
                          <img 
                            src={`http://localhost:8000/storage/${item.product_variant.product.images[0].image_path}`} 
                            alt="product" 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', background: 'var(--border-color)', borderRadius: '6px' }}></div>
                        )}
                        <span style={{ fontWeight: 500 }}>{item.product_variant?.product?.name || "Desconocido"}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        Talla: {item.product_variant?.size?.name || "N/A"}<br />
                        Color/Fit: {item.product_variant?.fit?.name || "N/A"}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>Bs. {Number(item.product_variant?.price || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>Bs. {((item.product_variant?.price || 0) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay productos en este carrito</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700, padding: '16px' }}>Total a Pagar:</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '18px', padding: '16px', color: 'var(--color-primary)' }}>
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
