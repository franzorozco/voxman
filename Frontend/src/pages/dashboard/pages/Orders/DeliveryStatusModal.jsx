import { useState, useEffect } from "react";
import { updateDeliveryStatus, assignDriver, getDeliveryDrivers } from "../../../../api/admin/orderNetwork";
import { toast } from "react-hot-toast";

export default function DeliveryStatusModal({ schedule, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  
  const [formData, setFormData] = useState({
    driver_id: schedule?.driver_id || "",
    status: schedule?.status || "assigned",
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data } = await getDeliveryDrivers();
      setDrivers(data);
    } catch (error) {
      toast.error("Error al cargar repartidores");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Assign driver if changed and valid
      if (formData.driver_id && formData.driver_id !== schedule.driver_id) {
        await assignDriver(schedule.id, formData.driver_id);
      }
      
      // 2. Update status if changed
      if (formData.status !== schedule.status) {
        await updateDeliveryStatus(schedule.id, formData.status);
      }
      
      toast.success("Estado actualizado correctamente");
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Gestionar Entrega</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Asignar Repartidor</label>
            <select
              value={formData.driver_id}
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
            >
              <option value="">-- Seleccionar Repartidor --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.user?.profile?.first_name} {d.user?.profile?.last_name_paternal} {d.vehicle_type ? `(${d.vehicle_type})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Estado Logístico</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="assigned">Agendado / Asignado</option>
              <option value="on_the_way">En camino</option>
              <option value="at_the_meeting_point">En el punto de encuentro</option>
              <option value="completed">Entregado (Finalizar Venta)</option>
              <option value="cancelled">Cancelado (Liberar Stock)</option>
            </select>
          </div>
          
          <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <strong>Nota:</strong> Al marcar como "Entregado", el stock reservado se descontará de forma permanente y la venta pasará a estado "pagado". Al "Cancelar", el stock será devuelto a la sucursal.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cerrar
          </button>
          <button className="action-btn primary" onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
