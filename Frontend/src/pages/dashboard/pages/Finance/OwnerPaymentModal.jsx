import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { createOwnerPayment, updateOwnerPayment } from "../../../../api/admin/finance";
import { getOwners } from "../../../../api/admin/owners";

export default function OwnerPaymentModal({ payment, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    owner_id: "",
    amount: "",
    payment_date: new Date().toISOString().split('T')[0],
    type: "withdrawal",
    payment_method: "",
    reference_number: "",
    notes: ""
  });

  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOwners();
    if (payment) {
      setFormData({
        owner_id: payment.owner_id || "",
        amount: payment.amount || "",
        payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
        type: payment.type || "withdrawal",
        payment_method: payment.payment_method || "",
        reference_number: payment.reference_number || "",
        notes: payment.notes || ""
      });
    }
  }, [payment]);

  const fetchOwners = async () => {
    try {
      const res = await getOwners();
      setOwners(res.data);
      if (!payment && res.data.length > 0) {
        setFormData(prev => ({ ...prev, owner_id: res.data[0].id }));
      }
    } catch (error) {
      toast.error("Error al cargar socios");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (payment) {
        await updateOwnerPayment(payment.id, formData);
        toast.success("Movimiento actualizado");
      } else {
        await createOwnerPayment(formData);
        toast.success("Movimiento registrado");
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar el movimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal scale-in" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <h2 style={{ margin: 0, padding: 0, fontSize: '20px', border: 'none', background: 'none', WebkitTextFillColor: 'var(--text-main)' }}>
            {payment ? "Editar Movimiento" : "Registrar Movimiento"}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Tipo de Movimiento</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="withdrawal">Retiro de Capital</option>
                  <option value="deposit">Inyección de Capital</option>
                </select>
              </div>

              <div className="form-group">
                <label>Socio</label>
                <select name="owner_id" value={formData.owner_id} onChange={handleChange} required>
                  {owners.map(o => (
                    <option key={o.id} value={o.id}>{o.user?.profile?.first_name} {o.user?.profile?.last_name_paternal}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Monto (Bs)</label>
                <input type="number" step="0.01" min="0.01" name="amount" required value={formData.amount} onChange={handleChange} placeholder="0.00" />
              </div>

              <div className="form-group">
                <label>Fecha</label>
                <input type="date" name="payment_date" required value={formData.payment_date} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Método de Pago</label>
                <input type="text" name="payment_method" value={formData.payment_method} onChange={handleChange} placeholder="Ej. Transferencia, Efectivo" />
              </div>

              <div className="form-group">
                <label>Nro. Referencia</label>
                <input type="text" name="reference_number" value={formData.reference_number} onChange={handleChange} placeholder="Ej. 12345678" />
              </div>
            </div>

            <div className="form-group">
              <label>Notas Adicionales</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Motivo o detalle del movimiento..." style={{ minHeight: '80px' }}></textarea>
            </div>

          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Movimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
