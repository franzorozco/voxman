import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getSupplierReturns } from "../../../../api/admin/supplierReturns";
import { RotateCcw, PackageOpen, Package } from "lucide-react";
import "../Purchases/Purchases.css";
import { API_BASE_URL } from "../../../../config/api";

const SupplierReturns = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getSupplierReturns();
      setItems(res.data);
    } catch (err) {
      toast.error("Error al cargar devoluciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="purchases-container">
      <div className="purchases-header">
        <div className="purchases-title">
          <RotateCcw size={24} />
          Devoluciones a Proveedores
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Historial de mermas y productos devueltos a los proveedores.
        </div>
      </div>

      <div className="purchases-table-container">
        {loading ? (
          <div className="loading-state">Cargando devoluciones...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No hay devoluciones registradas.</div>
        ) : (
          <table className="purchases-table">
            <thead>
              <tr>
                <th>Producto Devuelto</th>
                <th>Cantidad</th>
                <th>Proveedor</th>
                <th>Orden de Compra</th>
                <th>Motivo / Notas</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const attrIds = item.variant?.variant_attribute_values?.map(vav => vav.attribute_value_id) || [];
                const colorImg = item.variant?.product?.attribute_value_images?.find(img => attrIds.includes(img.attribute_value_id));

                const rawImageUrl = colorImg?.url 
                                  || item.variant?.variant_images?.[0]?.image_url 
                                  || item.variant?.product?.product_images?.[0]?.url 
                                  || item.variant?.product?.product_images?.[0]?.image_url;
                
                let finalImageUrl = `${API_BASE_URL}/storage/attributes/default.png`;
                if (rawImageUrl) {
                  finalImageUrl = rawImageUrl.startsWith('http') ? rawImageUrl : `${API_BASE_URL}${rawImageUrl.startsWith('/') ? '' : '/storage/'}${rawImageUrl}`;
                }

                return (
                  <tr key={item.id}>
                    <td>
                      {item.variant ? (
                        <div className="product-cell" style={{ display: 'flex', alignItems: 'center' }}>
                          <img 
                            src={finalImageUrl} 
                            alt="Prod" 
                            className="product-image-small" 
                            style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', marginRight: 10, border: '1px solid var(--border-color)' }} 
                            onError={(e) => { 
                              e.target.onerror = null; 
                              e.target.src = `${API_BASE_URL}/storage/attributes/default.png`; 
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 500 }}>{item.variant?.product?.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SKU: {item.variant?.sku}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)' }}>Múltiples / General</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{item.supplier?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.supplier?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>OC: {item.purchase?.invoice_number || 'S/N'}</div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '250px', whiteSpace: 'normal', fontSize: 13 }}>{item.reason}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{new Date(item.created_at).toLocaleDateString()}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SupplierReturns;
