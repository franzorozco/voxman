import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { resolveQuarantineItem } from "../../../../api/admin/quarantine";
import { getProducts } from "../../../../api/admin/products";
import { X, ArrowRightLeft, Trash2, RotateCcw } from "lucide-react";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function ResolveQuarantineModal({ isOpen, onClose, item, onSuccess }) {
  const [action, setAction] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For convert action
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [createQuickVariant, setCreateQuickVariant] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");

  const pendingCount = item?.quantity - (item?.resolved_quantity || 0);

  useEffect(() => {
    if (isOpen) {
      setQuantity(pendingCount);
      setAction("");
      setNotes("");
      setCreateQuickVariant(false);
      setSelectedProductId("");
      setSelectedVariantId("");
      fetchProducts();
    }
  }, [isOpen, item]);

  const fetchProducts = async () => {
    try {
      const { data } = await getProducts({ per_page: 100 });
      setProducts(data.data || data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action) return toast.error("Selecciona una acción");
    if (quantity < 1 || quantity > pendingCount) return toast.error("Cantidad inválida");

    const payload = {
      action,
      quantity,
      notes
    };

    if (action === "convert") {
      payload.create_quick_variant = createQuickVariant;
      if (createQuickVariant) {
        if (!selectedProductId) return toast.error("Selecciona un producto base");
        payload.product_id = selectedProductId;
      } else {
        if (!selectedVariantId) return toast.error("Selecciona la variante destino");
        payload.target_variant_id = selectedVariantId;
      }
    }

    try {
      setIsSubmitting(true);
      await resolveQuarantineItem(item.id, payload);
      toast.success("Resuelto correctamente");
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al resolver");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProductObj = products.find(p => p.id === selectedProductId);

  return (
    <div className="purchase-detail-modal-overlay">
      <div className="purchase-detail-modal" style={{ maxWidth: '600px' }}>
        <div className="purchase-detail-header">
          <h2>Resolver Merma</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div className="purchase-detail-body">
          <div className="summary-box" style={{ background: 'var(--bg-overlay)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 5px 0' }}>{item.variant?.product?.name}</h4>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Motivo: <strong>{item.reason === 'damaged' ? 'Dañado' : item.reason === 'wrong' ? 'Equivocado' : item.reason}</strong> | 
              Pendientes: <strong>{pendingCount}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Cantidad a resolver</label>
              <input 
                type="number"
                className="purchase-form-input"
                min="1"
                max={pendingCount}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 500 }}>¿Qué deseas hacer con estos {quantity} ítems?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                
                <label className={`action-card ${action === 'return' ? 'active' : ''}`} style={actionCardStyle(action === 'return')}>
                  <input type="radio" name="action" value="return" checked={action === 'return'} onChange={() => setAction('return')} style={{ display: 'none' }} />
                  <RotateCcw size={20} />
                  <span>Devolver a Proveedor</span>
                </label>
                
                <label className={`action-card ${action === 'discard' ? 'active' : ''}`} style={actionCardStyle(action === 'discard')}>
                  <input type="radio" name="action" value="discard" checked={action === 'discard'} onChange={() => setAction('discard')} style={{ display: 'none' }} />
                  <Trash2 size={20} />
                  <span>Dar de Baja (Pérdida)</span>
                </label>

                <label className={`action-card ${action === 'convert' ? 'active' : ''}`} style={actionCardStyle(action === 'convert')}>
                  <input type="radio" name="action" value="convert" checked={action === 'convert'} onChange={() => setAction('convert')} style={{ display: 'none' }} />
                  <ArrowRightLeft size={20} />
                  <span>Convertir a Variante</span>
                </label>
              </div>
            </div>

            {action === 'convert' && (
              <div style={{ background: 'var(--bg-overlay)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px', fontSize: '15px' }}>Opciones de Conversión</h4>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input 
                      type="checkbox" 
                      checked={createQuickVariant} 
                      onChange={(e) => {
                        setCreateQuickVariant(e.target.checked);
                        setSelectedVariantId("");
                      }} 
                    />
                    <span>Crear una Variante Rápida (Refurbished/Merma)</span>
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '5px 0 0 24px' }}>
                    Si se marca, el sistema creará automáticamente una nueva variante para el producto seleccionado con un SKU distintivo.
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Producto Base</label>
                  <CustomSelect 
                    className="purchase-form-select"
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setSelectedVariantId("");
                    }}
                    required
                    style={{ width: '100%' }}
                  >
                    <option value="">Seleccione un producto</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </CustomSelect>
                </div>

                {!createQuickVariant && selectedProductObj && (
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Variante Destino</label>
                    <CustomSelect 
                      className="purchase-form-select"
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccione a qué variante inyectar el stock</option>
                      {selectedProductObj.product_variants?.map(v => (
                        <option key={v.id} value={v.id}>{v.sku} - ${v.price}</option>
                      ))}
                    </CustomSelect>
                  </div>
                )}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Notas de Resolución (Obligatorio para devoluciones)</label>
              <textarea 
                className="purchase-form-input"
                style={{ minHeight: '80px', resize: 'vertical', width: '100%' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explique el motivo o detalle de esta acción..."
                required={action === 'return'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting || !action}>
                {isSubmitting ? "Procesando..." : "Confirmar Acción"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const actionCardStyle = (isActive) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '15px 10px',
  background: isActive ? 'var(--color-primary)' : 'var(--bg-card)',
  color: isActive ? '#fff' : 'var(--text-main)',
  border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--border-color)'}`,
  borderRadius: '8px',
  cursor: 'pointer',
  textAlign: 'center',
  transition: '0.2s',
  fontSize: '13px',
  fontWeight: '500'
});
