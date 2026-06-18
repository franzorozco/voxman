import { useState, useEffect } from "react";
import { checkIn, checkOut, getAttendanceStatus } from "../../../../api/admin/attendances";
import { Clock } from "lucide-react";
import { useAuthStore } from "../../../../store/authStore";
import toast from "react-hot-toast";

export default function AttendanceWidget() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState(null); // null, 'checked_in', 'checked_out'
  const [loading, setLoading] = useState(false);

  // We assume the user object includes the employee ID if they are an employee.
  // If your auth doesn't return employee.id, you might need to adjust this.
  const employeeId = user?.employee_id || user?.id; // Fallback or adjust as needed

  useEffect(() => {
    if (employeeId) {
      loadStatus();
    }
  }, [employeeId]);

  const loadStatus = async () => {
    try {
      const res = await getAttendanceStatus(employeeId);
      const att = res.data?.attendance;
      if (!att) {
        setStatus(null);
      } else if (att.check_out) {
        setStatus('checked_out');
      } else {
        setStatus('checked_in');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await checkIn(employeeId);
      toast.success("Entrada registrada!");
      setStatus('checked_in');
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al registrar entrada");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await checkOut(employeeId);
      toast.success("Salida registrada!");
      setStatus('checked_out');
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al registrar salida");
    } finally {
      setLoading(false);
    }
  };

  if (!employeeId) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '16px' }}>
      {status === null && (
        <button 
          onClick={handleCheckIn} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Clock size={16} /> Check In
        </button>
      )}
      
      {status === 'checked_in' && (
        <button 
          onClick={handleCheckOut} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Clock size={16} /> Check Out
        </button>
      )}

      {status === 'checked_out' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 'bold' }}>
          <Clock size={16} /> Turno Finalizado
        </div>
      )}
    </div>
  );
}
