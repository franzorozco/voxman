import { useState } from "react";
import { adjustStock } from "../../../../api/inventory";
import { X } from "lucide-react";

export default function AdjustStockModal({ item, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 0,
    reference: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.quantity === 0) {
      window.alert("La cantidad no puede ser cero.");
      return;
    }
    
    if (item.stock + formData.quantity < 0) {
      window.alert("El ajuste no puede dejar el stock en negativo.");
      return;
    }

    setLoading(true);
    try {
      await adjustStock({
        variant_id: item.variant_id,
        branch_id: item.branch_id,
        quantity: formData.quantity,
        reference: formData.reference
      });
      window.alert("Stock ajustado correctamente");
      onSuccess();
    } catch (error) {
      window.alert(error.response?.data?.message || "Error al ajustar stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
      <div className="modal-content" style={{ background: 'var(--bg-card)', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Ajustar Stock</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', background: 'var(--bg-input)' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--text-muted)' }}>Producto</p>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>{item?.variant?.product?.name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--text-muted)' }}>Stock Actual</p>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: 'var(--text-main)' }}>{item?.stock}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-main)' }}>
              Cantidad a Ajustar (+ / -)
            </label>
            <input
              type="number"
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '16px' }}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
              Usa un número negativo para restar (Ej. -5) o positivo para sumar (Ej. 10).
              <br/>
              <strong>Stock Final Estimado: {item.stock + formData.quantity}</strong>
            </small>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-main)' }}>
              Referencia / Motivo
            </label>
            <textarea
              required
              rows="3"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', resize: 'none' }}
              placeholder="Ej. Ingreso de mercadería, Producto dañado, Inventario físico..."
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
            >
              {loading ? "Guardando..." : "Confirmar Ajuste"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
