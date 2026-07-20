import { useState, useEffect } from "react";
import { convertToOrder } from "../../../../api/admin/orderNetwork";
import { getBranches } from "../../../../api/admin/branches";
import { toast } from "react-hot-toast";

export default function ScheduleDeliveryModal({ cart, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  
  const [formData, setFormData] = useState({
    cart_id: cart?.id || "",
    branch_id: "",
    guest_name: "",
    guest_phone: "",
    meeting_point_details: "",
    delivery_date: "",
    delivery_time: ""
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data } = await getBranches();
      // data might be paginated or an array depending on your branches API
      setBranches(data.data || data);
    } catch (error) {
      toast.error("Error al cargar sucursales");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await convertToOrder(formData);
      toast.success("Venta generada y entrega agendada");
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al agendar entrega");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSave}>
          <div className="modal-header">
            <h2>Agendar Entrega (Proforma: {cart?.reference_number})</h2>
            <button type="button" className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="modal-body">
            
            <div className="form-group">
              <label>Sucursal de Origen (Para reservar stock) *</label>
              <select
                required
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              >
                <option value="">-- Seleccione una sucursal --</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Nombre del Cliente (Invitado)</label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="Ej. 77712345"
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Punto de Encuentro *</label>
              <input
                type="text"
                required
                placeholder="Ej. Teleférico Morado El Alto"
                value={formData.meeting_point_details}
                onChange={(e) => setFormData({ ...formData, meeting_point_details: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Fecha de Entrega *</label>
                <input
                  type="date"
                  required
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Hora Estimada *</label>
                <input
                  type="time"
                  required
                  value={formData.delivery_time}
                  onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                />
              </div>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="action-btn success" disabled={loading}>
              {loading ? "Generando..." : "Confirmar y Generar Venta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
