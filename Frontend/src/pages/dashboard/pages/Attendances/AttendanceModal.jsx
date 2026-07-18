import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { createAttendance, updateAttendance } from "../../../../api/admin/attendances";
import { getEmployees } from "../../../../api/admin/employees";
import Spinner from "../../components/Spinner/Spinner";

export default function AttendanceModal({ attendance, onClose, onSuccess, initialDate }) {
  const isEditing = !!attendance;
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  
  const [formData, setFormData] = useState({
    employee_id: "",
    date: initialDate || new Date().toISOString().split('T')[0],
    check_in: "",
    check_out: "",
    status: "present",
    notes: ""
  });

  useEffect(() => {
    const fetchEmps = async () => {
      try {
        setLoadingEmployees(true);
        const res = await getEmployees();
        setEmployees(res.data || res);
      } catch (err) {
        toast.error("Error al cargar empleados");
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmps();
  }, []);

  useEffect(() => {
    if (isEditing && attendance) {
      setFormData({
        employee_id: attendance.employee_id,
        date: attendance.date,
        check_in: attendance.check_in ? new Date(attendance.check_in).toTimeString().substring(0, 5) : "",
        check_out: attendance.check_out ? new Date(attendance.check_out).toTimeString().substring(0, 5) : "",
        status: attendance.status || "present",
        notes: attendance.notes || ""
      });
    }
  }, [isEditing, attendance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await updateAttendance(attendance.id, formData);
        toast.success("Asistencia actualizada");
      } else {
        await createAttendance(formData);
        toast.success("Asistencia registrada");
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error al guardar la asistencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-content slide-up" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>{isEditing ? "Editar Asistencia" : "Registrar Asistencia Manual"}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-content">
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Empleado</label>
              <select 
                required
                disabled={isEditing || loadingEmployees}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
              >
                <option value="">Selecciona un empleado...</option>
                {employees.map(emp => {
                  const profile = emp.user?.profile || {};
                  const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''}`.trim() || 'Sin Nombre';
                  return (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code} - {fullName}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="modal-form-grid">
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Fecha</label>
                <input 
                  type="date" 
                  required
                  disabled={isEditing}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</label>
                <select 
                  required
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="present">Presente</option>
                  <option value="late">Atraso</option>
                  <option value="absent">Ausente / Falta</option>
                  <option value="excused">Licencia / Permiso</option>
                </select>
              </div>
            </div>

            <div className="modal-form-grid">
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Hora de Entrada</label>
                <input 
                  type="time" 
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                  value={formData.check_in}
                  onChange={(e) => setFormData({...formData, check_in: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Hora de Salida</label>
                <input 
                  type="time" 
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                  value={formData.check_out}
                  onChange={(e) => setFormData({...formData, check_out: e.target.value})}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Notas o Justificación</label>
              <textarea 
                rows="3"
                placeholder="Ej. Llegó tarde por tráfico, Falta por enfermedad..."
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px', resize: 'vertical' }}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
            
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Spinner size={20} color="#fff" /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
