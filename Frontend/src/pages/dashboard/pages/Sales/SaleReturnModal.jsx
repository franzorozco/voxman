import { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { createReturn } from "../../../../api/admin/returns";
import Spinner from "../../components/Spinner/Spinner";

export default function SaleReturnModal({ detail, onClose, onReturnSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity < 1 || quantity > detail.quantity) {
      toast.error("Cantidad inválida");
      return;
    }
    if (!reason.trim()) {
      toast.error("Debes ingresar un motivo para la devolución");
      return;
    }

    try {
      setLoading(true);
      await createReturn({
        sale_detail_id: detail.id,
        quantity: quantity,
        reason: reason
      });
      toast.success("Solicitud de devolución creada correctamente");
      onReturnSuccess();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Error al solicitar devolución";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const productName = detail.giftcard 
    ? `Giftcard ${detail.giftcard.code || ''}` 
    : detail.bundle 
      ? `Conjunto: ${detail.bundle.name}` 
      : detail.product_variant?.product?.name || 'Producto Desconocido';

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000 }}>
      <div className="modal-content fade-in" style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', width: '90%', maxWidth: '400px' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={18} className="text-primary"/> Solicitar Devolución
          </h2>
          <button onClick={onClose} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Producto:</div>
            <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{productName}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Comprados: {detail.quantity}</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Cantidad a Devolver
            </label>
            <input 
              type="number"
              min="1"
              max={detail.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Motivo de Devolución
            </label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Producto defectuoso, talla incorrecta, cliente arrepentido..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', minHeight: '80px', resize: 'vertical' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'var(--color-primary-text)', cursor: 'pointer', fontWeight: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              {loading ? <Spinner size={16} color="var(--color-primary-text)" /> : 'Confirmar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
