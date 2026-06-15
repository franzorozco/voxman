import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createGiftcard, reloadGiftcard } from "../../../../api/admin/giftcards";
import { getCustomers } from "../../../../api/admin/customers";
import toast from "react-hot-toast";

export default function GiftcardModal({ isOpen, onClose, onSuccess, mode, giftcard }) {
  const [amount, setAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [purchaserId, setPurchaserId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && mode === "create") {
      fetchCustomers();
    }
  }, [isOpen, mode]);

  const fetchCustomers = async () => {
    try {
      const res = await getCustomers();
      // Asumiendo res.data.data si es paginado, o res.data si es array
      setCustomers(res.data.data || res.data || []);
    } catch (error) {
      toast.error("Error al cargar clientes");
    }
  };

  if (!isOpen) return null;

  const isReload = mode === "reload";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (parseFloat(amount) < (isReload ? 1 : 50)) {
      toast.error(`El monto mínimo es ${isReload ? '1Bs' : '50Bs'}`);
      return;
    }

    setLoading(true);
    try {
      if (isReload) {
        await reloadGiftcard(giftcard.id, { amount: parseFloat(amount) });
        toast.success("Giftcard recargada exitosamente");
      } else {
        await createGiftcard({ 
          amount: parseFloat(amount),
          expires_at: expiresAt ? expiresAt : null,
          purchaser_id: purchaserId ? purchaserId : null
        });
        toast.success("Giftcard emitida exitosamente");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Ocurrió un error al procesar la operación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content giftcard-modal">
        <div className="modal-header">
          <h2>{isReload ? `Recargar Giftcard: ${giftcard?.code}` : "Emitir Nueva Giftcard"}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          
          <div className="form-group">
            <label>Monto a {isReload ? 'recargar' : 'cargar'} (Bs) *</label>
            <input
              type="number"
              step="0.01"
              min={isReload ? "1" : "50"}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Ej. ${isReload ? '20' : '100'}`}
            />
          </div>

          {!isReload && (
            <>
              <div className="form-group">
                <label>Asignar Comprador (Opcional)</label>
                <select value={purchaserId} onChange={(e) => setPurchaserId(e.target.value)}>
                  <option value="">-- Sin asignar --</option>
                  {customers.map(c => {
                    const name = c.user?.profile?.first_name || c.user?.username || 'Cliente';
                    const lastName = c.user?.profile?.last_name || '';
                    return (
                      <option key={c.id} value={c.id}>{name} {lastName} ({c.customer_code})</option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Fecha de expiración (Opcional)</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Procesando..." : (isReload ? "Recargar" : "Emitir")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
