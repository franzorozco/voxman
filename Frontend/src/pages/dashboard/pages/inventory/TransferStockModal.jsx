import { useState } from "react";
import { transferStock } from "../../../../api/admin/inventory";
import toast from "react-hot-toast";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

export default function TransferStockModal({ item, branches, onClose, onSuccess, onBack }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to_branch_id: "",
    quantity: 1,
    reference: ""
  });

  const availableBranches = branches.filter(b => b.id !== item.branch_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.quantity <= 0) {
      toast.error("La cantidad a transferir debe ser mayor a cero.");
      return;
    }
    
    if (formData.quantity > item.stock) {
      toast.error("No puedes transferir más del stock disponible.");
      return;
    }

    setLoading(true);
    try {
      await transferStock({
        variant_id: item.variant_id,
        from_branch_id: item.branch_id,
        to_branch_id: formData.to_branch_id,
        quantity: formData.quantity,
        reference: formData.reference
      });
      toast.success("Stock transferido correctamente");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error al transferir stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
      <div className="modal-content" style={{ background: 'var(--bg-card)', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onBack && (
              <button 
                type="button" 
                onClick={onBack}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Transferir Stock</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', background: 'var(--bg-input)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>{item?.variant?.product?.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
              <span>Origen: <strong>{item?.branch?.name}</strong></span>
              <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>Stock Disp: {item?.stock}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-main)' }}>
              Sucursal de Destino
            </label>
            <select
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
              value={formData.to_branch_id}
              onChange={(e) => setFormData({ ...formData, to_branch_id: e.target.value })}
            >
              <option value="" disabled>Seleccione una sucursal</option>
              {availableBranches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-main)' }}>
              Cantidad a Transferir
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                style={{ padding: '10px 20px', background: 'var(--bg-input)', border: 'none', borderRight: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >-</button>
              <input
                type="number"
                required
                min="1"
                max={item?.stock}
                style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', outline: 'none' }}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="no-spinners"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, quantity: Math.min(item?.stock, formData.quantity + 1) })}
                style={{ padding: '10px 20px', background: 'var(--bg-input)', border: 'none', borderLeft: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >+</button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-main)' }}>
              Referencia / Notas (Opcional)
            </label>
            <textarea
              rows="2"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', resize: 'none' }}
              placeholder="Ej. Reabastecimiento local centro..."
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
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'var(--color-primary-text)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? "Transfiriendo..." : <><ArrowRight size={16} /> Transferir</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
